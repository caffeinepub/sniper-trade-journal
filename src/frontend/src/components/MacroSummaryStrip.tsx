import { Minus, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useMemo } from "react";
import type { MarketNarrative, NewsItem } from "../utils/macroIntelligence";
import { detectMarketNarrative } from "../utils/macroIntelligence";
import type { AssetSentimentResult } from "../utils/sentimentEngine";

export interface MacroSummaryStripProps {
  sentiments: AssetSentimentResult[];
  articles: NewsItem[];
}

const ASSET_ORDER = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "Gold",
  "Oil",
  "Bitcoin",
  "Ethereum",
];
const ASSET_SHORT: Record<string, string> = {
  Bitcoin: "BTC",
  Ethereum: "ETH",
  Gold: "Gold",
  Oil: "Oil",
};

function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === "Bullish") return <TrendingUp className="h-3 w-3" />;
  if (sentiment === "Bearish") return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

export default function MacroSummaryStrip({
  sentiments,
  articles,
}: MacroSummaryStripProps) {
  const narrative: MarketNarrative = useMemo(
    () => detectMarketNarrative(articles, sentiments),
    [articles, sentiments],
  );

  const orderedSentiments = useMemo(() => {
    return ASSET_ORDER.map((asset) => {
      const found = sentiments.find((s) => s.asset === asset);
      return (
        found ?? {
          asset,
          sentiment: "Neutral" as const,
          basis: "No recent data",
          articleCount: 0,
          topHeadlines: [],
        }
      );
    });
  }, [sentiments]);

  const confidenceColor = {
    High: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    Low: "text-muted-foreground bg-muted border-border",
  }[narrative.confidence];

  return (
    <div
      className="bg-card border border-border rounded-xl p-4"
      data-ocid="macro.summary.panel"
    >
      <div className="flex flex-col gap-3">
        {/* Top row: asset badges + narrative */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Asset sentiment badges */}
          <div className="flex flex-wrap gap-1.5">
            {orderedSentiments.map((s) => {
              const sentStyle =
                s.sentiment === "Bullish"
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : s.sentiment === "Bearish"
                    ? "text-red-400 bg-red-500/10 border-red-500/20"
                    : "text-muted-foreground bg-muted border-border";
              const label = ASSET_SHORT[s.asset] ?? s.asset;
              return (
                <div
                  key={s.asset}
                  title={s.basis}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${sentStyle}`}
                  data-ocid={`macro.${s.asset.toLowerCase()}.toggle`}
                >
                  <span className="font-bold">{label}</span>
                  <SentimentIcon sentiment={s.sentiment} />
                  <span className="opacity-80">{s.sentiment}</span>
                </div>
              );
            })}
          </div>

          {/* Narrative box */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal/10 border border-teal/30 flex-shrink-0"
            data-ocid="macro.narrative.panel"
          >
            <Zap className="h-3.5 w-3.5 text-teal flex-shrink-0" />
            <div>
              <p className="text-[10px] text-teal/70 uppercase tracking-wide font-medium">
                Narrative
              </p>
              <p className="text-xs font-bold text-teal">{narrative.title}</p>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ml-1 ${confidenceColor}`}
            >
              {narrative.confidence}
            </span>
          </div>
        </div>

        {/* Drivers row */}
        {narrative.drivers.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
              Key Drivers:
            </span>
            {narrative.drivers.map((driver, i) => (
              <span key={driver} className="text-xs text-foreground/80">
                {driver}
                {i < narrative.drivers.length - 1 && (
                  <span className="mx-1.5 text-border">·</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
