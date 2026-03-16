/**
 * Institutional Sentiment Engine
 *
 * Analyzes the narrative and tone of financial news articles to determine
 * Bullish, Bearish, or Neutral directional bias for tracked assets.
 * No numeric scoring is exposed — sentiment is determined by contextual
 * interpretation of the article content.
 */

// ──────────────────────────────────────────────
// Asset keyword detection
// ──────────────────────────────────────────────
export const ASSET_KEYWORDS: Record<string, string[]> = {
  USD: [
    "usd",
    "dollar",
    "us dollar",
    "fed ",
    "fed.",
    "federal reserve",
    "fomc",
    "greenback",
    "treasury",
    "us economy",
    "american economy",
  ],
  EUR: [
    "eur",
    "euro ",
    "euros",
    "ecb",
    "european central bank",
    "eurozone",
    "euro zone",
    "eu economy",
  ],
  GBP: [
    "gbp",
    "pound",
    "sterling",
    "bank of england",
    "boe",
    "uk economy",
    "british economy",
  ],
  JPY: [
    "jpy",
    "yen",
    "bank of japan",
    "boj",
    "japanese economy",
    "japan economy",
  ],
  Gold: ["gold", "xau", "precious metal", "bullion", "safe haven", "xauusd"],
  Oil: [
    "oil",
    "crude",
    "opec",
    "energy price",
    "energy market",
    "brent",
    "wti",
    "barrel",
    "petroleum",
  ],
  Bitcoin: [
    "bitcoin",
    "btc",
    "cryptocurrency",
    "crypto market",
    "digital asset",
    "blockchain",
  ],
  Ethereum: ["ethereum", "eth ", "eth,", "eth.", "defi"],
};

// ──────────────────────────────────────────────
// Contextual bullish signals
// ──────────────────────────────────────────────
const BULLISH_SIGNALS = [
  // Strength / momentum
  "strengthen",
  "strengthens",
  "strengthening",
  "rally",
  "rallies",
  "rallying",
  "surge",
  "surges",
  "surging",
  "soar",
  "soars",
  "soaring",
  "climb",
  "climbs",
  "climbing",
  "jump",
  "jumps",
  "jumping",
  "rise",
  "rises",
  "rising",
  "gain",
  "gains",
  "gaining",
  "advance",
  "advances",
  "advancing",
  // Directional bias
  "bullish",
  "upside",
  "uptrend",
  "breakout",
  "record high",
  "all-time high",
  "outperform",
  "beats expectations",
  "beat expectations",
  "above expectations",
  "better than expected",
  // Monetary policy — hawkish
  "rate hike",
  "rate hikes",
  "interest rate hike",
  "hawkish",
  "tightening",
  "tighter policy",
  // Macro positive
  "robust",
  "resilient",
  "strong growth",
  "strong economy",
  "strong demand",
  "demand rises",
  "demand surge",
  "buy signal",
  "accumulate",
  "optimistic outlook",
  "positive outlook",
  "economic expansion",
  "growth accelerates",
  // Safe-haven / commodity bullish
  "safe haven demand",
  "supply cut",
  "supply shortage",
  "production cut",
  "energy demand",
];

// ──────────────────────────────────────────────
// Contextual bearish signals
// ──────────────────────────────────────────────
const BEARISH_SIGNALS = [
  // Weakness / momentum
  "weaken",
  "weakens",
  "weakening",
  "fall",
  "falls",
  "falling",
  "decline",
  "declines",
  "declining",
  "drop",
  "drops",
  "dropping",
  "plunge",
  "plunges",
  "plunging",
  "slide",
  "slides",
  "sliding",
  "slip",
  "slips",
  "slipping",
  "tumble",
  "tumbles",
  "tumbling",
  "sink",
  "sinks",
  "sinking",
  "retreat",
  "retreats",
  // Directional bias
  "bearish",
  "downside",
  "downtrend",
  "breakdown",
  "sell-off",
  "selloff",
  "crash",
  "collapse",
  "record low",
  "underperform",
  "misses expectations",
  "miss expectations",
  "below expectations",
  "worse than expected",
  // Monetary policy — dovish
  "rate cut",
  "rate cuts",
  "interest rate cut",
  "dovish",
  "easing",
  "looser policy",
  "quantitative easing",
  // Macro negative
  "recession",
  "recession fears",
  "contraction",
  "stagflation",
  "slowdown",
  "growth slows",
  "growth concerns",
  "economic uncertainty",
  "weak demand",
  "demand falls",
  "demand weakness",
  "inflation fears",
  "debt crisis",
  "financial stress",
  "banking crisis",
  "credit tightening",
  "capital flight",
  // Safe-haven / commodity bearish
  "supply glut",
  "oversupply",
  "production increase",
  "demand destruction",
];

// ──────────────────────────────────────────────
// Asset-specific contextual overrides
// These capture cases where the same phrase means
// opposite things for different assets.
// ──────────────────────────────────────────────
const ASSET_BULLISH_OVERRIDES: Record<string, string[]> = {
  Gold: [
    "inflation",
    "inflationary",
    "geopolitical tension",
    "war",
    "crisis",
    "uncertainty",
    "haven",
    "dollar weakness",
    "fed pauses",
    "rate pause",
  ],
  Oil: [
    "opec cuts",
    "supply cut",
    "production cut",
    "energy demand",
    "oil demand",
    "tight supply",
  ],
  Bitcoin: [
    "etf approval",
    "institutional adoption",
    "crypto rally",
    "bitcoin halving",
    "halving",
    "defi growth",
  ],
  Ethereum: [
    "etf approval",
    "institutional adoption",
    "defi growth",
    "staking",
    "network upgrade",
  ],
};

const ASSET_BEARISH_OVERRIDES: Record<string, string[]> = {
  USD: [
    "dollar weakness",
    "dollar falls",
    "dollar declines",
    "fed pauses",
    "us debt",
    "budget deficit",
    "trade deficit",
  ],
  Gold: [
    "gold selloff",
    "gold declines",
    "gold falls",
    "risk-on",
    "gold drops",
  ],
  Oil: [
    "demand destruction",
    "recession fears",
    "opec output increase",
    "supply glut",
    "oil glut",
  ],
  Bitcoin: [
    "crypto ban",
    "regulatory crackdown",
    "crypto selloff",
    "bitcoin crash",
    "exchange collapse",
    "sec action",
  ],
  Ethereum: [
    "crypto ban",
    "regulatory crackdown",
    "ethereum selloff",
    "eth crash",
  ],
};

// ──────────────────────────────────────────────
// Neutral/wait-and-see signals (reduce conviction)
// ──────────────────────────────────────────────
const NEUTRAL_SIGNALS = [
  "await",
  "awaits",
  "wait",
  "waiting",
  "watch",
  "watching",
  "uncertain",
  "unclear",
  "mixed",
  "steady",
  "unchanged",
  "holds",
  "holds steady",
  "on hold",
  "pause",
  "pauses",
  "stabilize",
  "stabilizes",
  "consolidate",
  "range-bound",
  "sideways",
  "flat",
  "modest",
];

// ──────────────────────────────────────────────
// Public types
// ──────────────────────────────────────────────
export interface AssetSentimentResult {
  asset: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  /** Human-readable source of the bias */
  basis: string;
  /** Number of relevant articles analyzed */
  articleCount: number;
  /** Top 3 recent headlines that drove the sentiment */
  topHeadlines: string[];
}

// ──────────────────────────────────────────────
// Core helpers
// ──────────────────────────────────────────────

export function detectAffectedAssets(
  title: string,
  description: string,
): string[] {
  const text = `${title} ${description}`.toLowerCase();
  return Object.entries(ASSET_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => text.includes(kw)))
    .map(([asset]) => asset);
}

/**
 * Determine the directional tone of a single article for a specific asset.
 * Uses contextual signals rather than numeric scoring.
 */
export function analyzeArticleTone(
  title: string,
  summary: string,
  asset: string,
): "Bullish" | "Bearish" | "Neutral" {
  const text = `${title} ${summary}`.toLowerCase();

  // Count signal matches
  let bullishHits = 0;
  let bearishHits = 0;
  let neutralHits = 0;

  for (const signal of BULLISH_SIGNALS) {
    if (text.includes(signal)) bullishHits++;
  }
  for (const signal of BEARISH_SIGNALS) {
    if (text.includes(signal)) bearishHits++;
  }
  for (const signal of NEUTRAL_SIGNALS) {
    if (text.includes(signal)) neutralHits++;
  }

  // Apply asset-specific overrides (these carry extra weight)
  const assetBullish = ASSET_BULLISH_OVERRIDES[asset] ?? [];
  const assetBearish = ASSET_BEARISH_OVERRIDES[asset] ?? [];
  for (const signal of assetBullish) {
    if (text.includes(signal)) bullishHits += 2; // extra conviction
  }
  for (const signal of assetBearish) {
    if (text.includes(signal)) bearishHits += 2;
  }

  // Neutral signals dampen conviction
  if (neutralHits >= 2 && Math.abs(bullishHits - bearishHits) <= 1) {
    return "Neutral";
  }

  if (bullishHits > bearishHits) return "Bullish";
  if (bearishHits > bullishHits) return "Bearish";
  return "Neutral";
}

// ──────────────────────────────────────────────
// Main export: compute aggregate sentiment
// ──────────────────────────────────────────────

/**
 * Compute the current Bullish / Bearish / Neutral state for all 8 tracked
 * assets by analyzing the narrative of the most recent articles.
 *
 * Recency is respected: articles are ordered with newest first (caller must
 * pass them in recency order, or the function uses all equally).
 * A rolling window of the 30 most recent relevant articles per asset is used.
 */
export function computeAssetSentiments(
  backendArticles: Array<{
    id: string;
    headline: string;
    summary: string;
    currency: string;
    sentiment: string;
    institution?: string;
  }>,
  rssArticles: Array<{
    id: string;
    title: string;
    description: string;
    source: string;
  }>,
  windowSize = 30,
): AssetSentimentResult[] {
  const ALL_ASSETS = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "Gold",
    "Oil",
    "Bitcoin",
    "Ethereum",
  ];

  // Per-asset article collection
  const assetArticles: Record<
    string,
    Array<{ headline: string; tone: "Bullish" | "Bearish" | "Neutral" }>
  > = {};
  for (const a of ALL_ASSETS) assetArticles[a] = [];

  // Process backend (curated) articles
  // Respect the explicit sentiment if it matches an asset keyword
  for (const article of backendArticles) {
    const currency = article.currency;
    if (assetArticles[currency]) {
      // Use the curated sentiment directly — these are human-verified
      const tone = article.sentiment as "Bullish" | "Bearish" | "Neutral";
      assetArticles[currency].push({ headline: article.headline, tone });
    }
    // Also run multi-asset detection on the headline + summary
    const extra = detectAffectedAssets(article.headline, article.summary ?? "");
    for (const ea of extra) {
      if (ea !== currency && assetArticles[ea]) {
        const tone = analyzeArticleTone(
          article.headline,
          article.summary ?? "",
          ea,
        );
        assetArticles[ea].push({ headline: article.headline, tone });
      }
    }
  }

  // Process RSS articles — full narrative analysis
  for (const article of rssArticles) {
    const affectedAssets = detectAffectedAssets(
      article.title,
      article.description ?? "",
    );
    if (affectedAssets.length === 0) continue;
    for (const asset of affectedAssets) {
      if (!assetArticles[asset]) continue;
      const tone = analyzeArticleTone(
        article.title,
        article.description ?? "",
        asset,
      );
      assetArticles[asset].push({ headline: article.title, tone });
    }
  }

  return ALL_ASSETS.map((asset) => {
    // Use only the most recent `windowSize` articles for this asset
    const entries = assetArticles[asset].slice(-windowSize);

    if (entries.length === 0) {
      return {
        asset,
        sentiment: "Neutral" as const,
        basis: "No recent articles",
        articleCount: 0,
        topHeadlines: [],
      };
    }

    // Count directional tones
    let bullishCount = 0;
    let bearishCount = 0;
    for (const e of entries) {
      if (e.tone === "Bullish") bullishCount++;
      else if (e.tone === "Bearish") bearishCount++;
    }

    // Determine dominant sentiment:
    // Require at least a clear majority over neutral noise
    const total = entries.length;
    const bullishRatio = bullishCount / total;
    const bearishRatio = bearishCount / total;

    let sentiment: "Bullish" | "Bearish" | "Neutral";
    let basis: string;

    if (bullishRatio > 0.45 && bullishCount > bearishCount) {
      sentiment = "Bullish";
      basis = `${bullishCount} of ${total} articles suggest positive outlook`;
    } else if (bearishRatio > 0.45 && bearishCount > bullishCount) {
      sentiment = "Bearish";
      basis = `${bearishCount} of ${total} articles suggest negative outlook`;
    } else if (bullishCount > bearishCount + 1) {
      sentiment = "Bullish";
      basis = "More bullish signals than bearish across recent coverage";
    } else if (bearishCount > bullishCount + 1) {
      sentiment = "Bearish";
      basis = "More bearish signals than bullish across recent coverage";
    } else {
      sentiment = "Neutral";
      basis =
        bullishCount === bearishCount && bullishCount > 0
          ? `Mixed signals — ${bullishCount} bullish vs ${bearishCount} bearish`
          : "No clear directional bias in recent coverage";
    }

    const topHeadlines = entries
      .filter((e) => e.tone === sentiment)
      .slice(-3)
      .reverse()
      .map((e) => e.headline);

    return {
      asset,
      sentiment,
      basis,
      articleCount: total,
      topHeadlines,
    };
  });
}

// Legacy compatibility — kept so callers that previously used scoreArticleForAsset don't break
export function scoreArticleForAsset(
  title: string,
  description: string,
  asset: string,
): "Bullish" | "Bearish" | "Neutral" {
  return analyzeArticleTone(title, description, asset);
}

// Legacy: detectArticleSentimentGeneric for any remaining callers
export function detectArticleSentimentGeneric(
  title: string,
  description: string,
): "Bullish" | "Bearish" | "Neutral" {
  return analyzeArticleTone(title, description, "");
}
