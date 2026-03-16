/**
 * Macro Intelligence Utilities
 *
 * Provides tier classification, forecast detection, news clustering,
 * market narrative detection, and currency pair impact mapping.
 */

import type { AssetSentimentResult } from "./sentimentEngine";

// ─── Unified NewsItem interface ───────────────────────────────────────────────
export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  institution?: string;
  categories?: string[];
  publishedDate?: string;
  date?: string;
  currency?: string;
  sentiment?: string;
}

// ─── Source Tier Classification ──────────────────────────────────────────────
export type SourceTier = 1 | 2 | 3;

const TIER1_INSTITUTIONS = [
  "goldman sachs",
  "jpmorgan",
  "jpmorgan chase",
  "morgan stanley",
  "federal reserve",
  "fed",
  "fomc",
  "ecb",
  "european central bank",
  "bank of england",
  "boe",
  "bank of japan",
  "boj",
];

const TIER2_SOURCES = [
  "reuters",
  "bloomberg",
  "financial times",
  "ft.com",
  "cnbc",
  "marketwatch",
];

export function getSourceTier(source: string, institution: string): SourceTier {
  const srcLow = source.toLowerCase();
  const instLow = institution.toLowerCase();

  if (TIER1_INSTITUTIONS.some((t) => instLow.includes(t))) return 1;
  if (TIER1_INSTITUTIONS.some((t) => srcLow.includes(t))) return 1;
  if (TIER2_SOURCES.some((t) => srcLow.includes(t))) return 2;
  return 3;
}

// ─── Forecast Detection ──────────────────────────────────────────────────────
const FORECAST_KEYWORDS = [
  "target",
  "forecast",
  "projects",
  "expects price",
  "price target",
  "bullish on",
  "bearish on",
  "calls for",
  "sets target",
  "predicts",
  "outlook",
  "projection",
  "expects to reach",
  "could reach",
  "price outlook",
];

export function isForecastArticle(headline: string, summary: string): boolean {
  const text = `${headline} ${summary}`.toLowerCase();
  return FORECAST_KEYWORDS.some((kw) => text.includes(kw));
}

// ─── News Clustering ─────────────────────────────────────────────────────────
export interface NewsCluster {
  id: string;
  title: string;
  articles: NewsItem[];
  categories: string[];
  primarySource: string;
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "in",
  "of",
  "to",
  "for",
  "and",
  "or",
  "on",
  "at",
  "by",
  "with",
  "from",
  "as",
  "be",
  "was",
  "were",
  "has",
  "have",
  "had",
  "this",
  "that",
  "it",
  "its",
  "will",
  "may",
  "can",
  "could",
  "would",
  "should",
  "not",
  "no",
  "up",
  "into",
  "over",
  "after",
]);

function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w)),
  );
}

function sharedKeywordCount(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const w of a) {
    if (b.has(w)) count++;
  }
  return count;
}

export function clusterArticles(articles: NewsItem[]): NewsCluster[] {
  if (articles.length === 0) return [];

  const keywordSets = articles.map((a) =>
    extractKeywords(`${a.headline} ${a.summary}`),
  );

  const assigned = new Array(articles.length).fill(-1);
  const clusters: number[][] = []; // array of article indices

  for (let i = 0; i < articles.length; i++) {
    if (assigned[i] !== -1) continue;

    let matchedCluster = -1;
    for (let ci = 0; ci < clusters.length; ci++) {
      // Check against any existing member
      const clusterRep = clusters[ci][0];
      if (sharedKeywordCount(keywordSets[i], keywordSets[clusterRep]) >= 2) {
        matchedCluster = ci;
        break;
      }
    }

    if (matchedCluster === -1) {
      matchedCluster = clusters.length;
      clusters.push([]);
    }
    clusters[matchedCluster].push(i);
    assigned[i] = matchedCluster;
  }

  return clusters.map((indices, ci) => {
    const clusterArticles = indices.map((i) => articles[i]);
    // Representative: article with most keywords
    const rep = clusterArticles.reduce((best, art, idx) =>
      keywordSets[indices[idx]].size > keywordSets[indices[0]].size
        ? art
        : best,
    );
    const allCats = Array.from(
      new Set(clusterArticles.flatMap((a) => a.categories ?? [])),
    );
    return {
      id: `cluster_${ci}_${indices[0]}`,
      title: rep.headline,
      articles: clusterArticles,
      categories: allCats,
      primarySource: rep.source,
    };
  });
}

// ─── Market Narrative Detection ──────────────────────────────────────────────
export interface MarketNarrative {
  title: string;
  drivers: string[];
  confidence: "High" | "Medium" | "Low";
  description: string;
}

const NARRATIVE_DESCRIPTIONS: Record<string, string> = {
  "Dollar Strength Cycle":
    "USD is gaining broadly. Consider selling EUR/USD, GBP/USD and buying USD/JPY. Dollar strength often pressures commodities priced in USD.",
  "Energy Shock Inflation":
    "Rising energy prices are driving inflation fears. Watch for central bank responses and commodity-linked currency (CAD) strength.",
  "Risk-Off Environment":
    "Markets are in defensive mode. Gold and JPY typically outperform. Reduce exposure to risk assets and crypto.",
  "Crypto Risk Rally":
    "Digital assets are rallying, indicating a risk-on environment. BTC/USD and ETH/USD are trending up.",
  "Central Bank Pivot":
    "Central banks are signaling a shift in monetary policy. Rate cuts or pauses can weaken currencies and support equities.",
  "Geopolitical Risk Premium":
    "Geopolitical tensions are adding risk premiums to safe-haven assets. Gold, JPY, and USD may benefit.",
  "Mixed Market Conditions":
    "No dominant macro theme identified. Trade selectively based on individual asset setups.",
};

function extractTopDrivers(articles: NewsItem[]): string[] {
  const phraseFreq: Record<string, number> = {};
  const driverPhrases = [
    "rate hike",
    "rate cut",
    "interest rate",
    "inflation",
    "dollar rally",
    "oil prices",
    "gold rally",
    "recession",
    "fed decision",
    "ecb meeting",
    "bank of england",
    "monetary policy",
    "bitcoin surge",
    "crypto rally",
    "energy crisis",
    "war escalation",
    "supply disruption",
    "sanctions",
    "gdp growth",
    "employment data",
    "cpi data",
    "nfp report",
    "dollar strength",
    "dollar weakness",
    "safe haven",
    "risk off",
    "risk on",
    "yield curve",
  ];

  for (const article of articles) {
    const text = `${article.headline} ${article.summary}`.toLowerCase();
    for (const phrase of driverPhrases) {
      if (text.includes(phrase)) {
        phraseFreq[phrase] = (phraseFreq[phrase] ?? 0) + 1;
      }
    }
  }

  return Object.entries(phraseFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([phrase]) => phrase);
}

export function detectMarketNarrative(
  articles: NewsItem[],
  sentiments: AssetSentimentResult[],
): MarketNarrative {
  const getSentiment = (asset: string) =>
    sentiments.find((s) => s.asset === asset)?.sentiment ?? "Neutral";

  const allText = articles
    .map((a) => `${a.headline} ${a.summary}`)
    .join(" ")
    .toLowerCase();

  const currencyArticles = articles.filter((a) =>
    (a.categories ?? []).includes("currency"),
  );
  const commodityArticles = articles.filter((a) =>
    (a.categories ?? []).includes("commodity"),
  );
  const cryptoArticles = articles.filter((a) =>
    (a.categories ?? []).includes("crypto"),
  );

  const usdSentiment = getSentiment("USD");
  const oilSentiment = getSentiment("Oil");
  const goldSentiment = getSentiment("Gold");
  const btcSentiment = getSentiment("Bitcoin");
  const ethSentiment = getSentiment("Ethereum");

  const bearishCount = sentiments.filter(
    (s) => s.sentiment === "Bearish",
  ).length;

  const hasPivotSignals =
    allText.includes("rate cut") ||
    allText.includes("pause") ||
    allText.includes("pivot") ||
    allText.includes("dovish");

  const hasGeoPolitical =
    allText.includes("war") ||
    allText.includes("conflict") ||
    allText.includes("sanctions") ||
    allText.includes("tensions");

  const hasRecession =
    allText.includes("recession") ||
    allText.includes("slowdown") ||
    allText.includes("contraction");

  // Score each narrative
  let bestNarrative = "Mixed Market Conditions";
  let bestScore = 0;
  let confidence: "High" | "Medium" | "Low" = "Low";

  const scores: Record<string, number> = {
    "Dollar Strength Cycle":
      (usdSentiment === "Bullish" ? 2 : 0) +
      (currencyArticles.length >= 3 ? 2 : 0) +
      (allText.includes("dollar strength") ? 1 : 0),

    "Energy Shock Inflation":
      (oilSentiment === "Bullish" || goldSentiment === "Bullish" ? 2 : 0) +
      (commodityArticles.length >= 3 ? 2 : 0) +
      (allText.includes("inflation") ? 1 : 0),

    "Risk-Off Environment":
      (bearishCount >= 3 ? 2 : 0) +
      (hasRecession ? 2 : 0) +
      (goldSentiment === "Bullish" ? 1 : 0),

    "Crypto Risk Rally":
      (btcSentiment === "Bullish" || ethSentiment === "Bullish" ? 2 : 0) +
      (cryptoArticles.length >= 3 ? 2 : 0) +
      (allText.includes("crypto rally") ? 1 : 0),

    "Central Bank Pivot": hasPivotSignals ? 4 : 0,

    "Geopolitical Risk Premium": hasGeoPolitical ? 4 : 0,
  };

  for (const [narrative, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestNarrative = narrative;
    }
  }

  if (bestScore >= 4) confidence = "High";
  else if (bestScore >= 2) confidence = "Medium";
  else confidence = "Low";

  const drivers =
    extractTopDrivers(articles).length > 0
      ? extractTopDrivers(articles)
      : ["global macro uncertainty"];

  return {
    title: bestNarrative,
    drivers,
    confidence,
    description:
      NARRATIVE_DESCRIPTIONS[bestNarrative] ??
      NARRATIVE_DESCRIPTIONS["Mixed Market Conditions"],
  };
}

// ─── Currency Pair Impact Mapping ────────────────────────────────────────────
export interface PairImpact {
  pair: string;
  direction: "up" | "down";
  reason: string;
}

export function getCurrencyPairImpacts(
  assetSentiments: AssetSentimentResult[],
): Record<string, PairImpact[]> {
  const getSentiment = (asset: string) =>
    assetSentiments.find((s) => s.asset === asset)?.sentiment ?? "Neutral";

  const usd = getSentiment("USD");
  const eur = getSentiment("EUR");
  const gbp = getSentiment("GBP");
  const jpy = getSentiment("JPY");
  const gold = getSentiment("Gold");
  const oil = getSentiment("Oil");
  const btc = getSentiment("Bitcoin");
  const eth = getSentiment("Ethereum");

  const forex: PairImpact[] = [];
  const commodities: PairImpact[] = [];
  const crypto: PairImpact[] = [];

  // USD impacts
  if (usd === "Bullish") {
    forex.push(
      { pair: "EUR/USD", direction: "down", reason: "USD Bullish" },
      { pair: "GBP/USD", direction: "down", reason: "USD Bullish" },
      { pair: "USD/JPY", direction: "up", reason: "USD Bullish" },
      { pair: "USD/CHF", direction: "up", reason: "USD Bullish" },
    );
  } else if (usd === "Bearish") {
    forex.push(
      { pair: "EUR/USD", direction: "up", reason: "USD Bearish" },
      { pair: "GBP/USD", direction: "up", reason: "USD Bearish" },
      { pair: "USD/JPY", direction: "down", reason: "USD Bearish" },
    );
  }

  // EUR impacts
  if (eur === "Bullish") {
    forex.push(
      { pair: "EUR/USD", direction: "up", reason: "EUR Bullish" },
      { pair: "EUR/GBP", direction: "up", reason: "EUR Bullish" },
      { pair: "EUR/JPY", direction: "up", reason: "EUR Bullish" },
    );
  } else if (eur === "Bearish") {
    forex.push(
      { pair: "EUR/USD", direction: "down", reason: "EUR Bearish" },
      { pair: "EUR/GBP", direction: "down", reason: "EUR Bearish" },
    );
  }

  // GBP impacts
  if (gbp === "Bullish") {
    forex.push(
      { pair: "GBP/USD", direction: "up", reason: "GBP Bullish" },
      { pair: "EUR/GBP", direction: "down", reason: "GBP Bullish" },
      { pair: "GBP/JPY", direction: "up", reason: "GBP Bullish" },
    );
  } else if (gbp === "Bearish") {
    forex.push({ pair: "GBP/USD", direction: "down", reason: "GBP Bearish" });
  }

  // JPY impacts (safe haven)
  if (jpy === "Bullish") {
    forex.push(
      {
        pair: "USD/JPY",
        direction: "down",
        reason: "JPY Bullish (Safe Haven)",
      },
      {
        pair: "EUR/JPY",
        direction: "down",
        reason: "JPY Bullish (Safe Haven)",
      },
      {
        pair: "GBP/JPY",
        direction: "down",
        reason: "JPY Bullish (Safe Haven)",
      },
    );
  }

  // Gold impacts
  if (gold === "Bullish") {
    commodities.push({
      pair: "XAU/USD",
      direction: "up",
      reason: "Gold Bullish",
    });
  } else if (gold === "Bearish") {
    commodities.push({
      pair: "XAU/USD",
      direction: "down",
      reason: "Gold Bearish",
    });
  }

  // Oil impacts
  if (oil === "Bullish") {
    commodities.push(
      { pair: "WTI/USD", direction: "up", reason: "Oil Bullish" },
      {
        pair: "USD/CAD",
        direction: "down",
        reason: "Oil Bullish (CAD strengths)",
      },
    );
  } else if (oil === "Bearish") {
    commodities.push({
      pair: "WTI/USD",
      direction: "down",
      reason: "Oil Bearish",
    });
  }

  // Crypto impacts
  if (btc === "Bullish") {
    crypto.push({
      pair: "BTC/USD",
      direction: "up",
      reason: "Bitcoin Bullish",
    });
  } else if (btc === "Bearish") {
    crypto.push({
      pair: "BTC/USD",
      direction: "down",
      reason: "Bitcoin Bearish",
    });
  }
  if (eth === "Bullish") {
    crypto.push({
      pair: "ETH/USD",
      direction: "up",
      reason: "Ethereum Bullish",
    });
  } else if (eth === "Bearish") {
    crypto.push({
      pair: "ETH/USD",
      direction: "down",
      reason: "Ethereum Bearish",
    });
  }

  // Deduplicate pairs (keep last assignment)
  const dedup = (impacts: PairImpact[]): PairImpact[] => {
    const seen = new Map<string, PairImpact>();
    for (const impact of impacts) {
      seen.set(impact.pair, impact);
    }
    return Array.from(seen.values());
  };

  return {
    forex: dedup(forex),
    commodities: dedup(commodities),
    crypto: dedup(crypto),
  };
}
