import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, GitBranch } from "lucide-react";
import { useMemo } from "react";
import { getCurrencyPairImpacts } from "../utils/macroIntelligence";
import type { AssetSentimentResult } from "../utils/sentimentEngine";

interface CurrencyPairImpactPanelProps {
  sentiments: AssetSentimentResult[];
}

function PairRow({
  pair,
  direction,
  reason,
}: { pair: string; direction: "up" | "down"; reason: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground font-mono">
          {pair}
        </span>
        <span className="text-[10px] text-muted-foreground">{reason}</span>
      </div>
      <div
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
          direction === "up"
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-red-500/15 text-red-400"
        }`}
      >
        {direction === "up" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
        {direction === "up" ? "Bullish" : "Bearish"}
      </div>
    </div>
  );
}

export default function CurrencyPairImpactPanel({
  sentiments,
}: CurrencyPairImpactPanelProps) {
  const impacts = useMemo(
    () => getCurrencyPairImpacts(sentiments),
    [sentiments],
  );

  const hasAny =
    impacts.forex.length > 0 ||
    impacts.commodities.length > 0 ||
    impacts.crypto.length > 0;

  if (!hasAny) return null;

  return (
    <Card className="bg-card border-border" data-ocid="pair_impact.panel">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-teal" />
          <CardTitle className="text-sm font-semibold text-foreground">
            Currency Pair Impact Mapping
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sentiment-derived trading implications for major pairs
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {impacts.forex.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-2">
                Forex Pairs
              </p>
              {impacts.forex.map((p) => (
                <PairRow key={p.pair} {...p} />
              ))}
            </div>
          )}
          {impacts.commodities.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-2">
                Commodities
              </p>
              {impacts.commodities.map((p) => (
                <PairRow key={p.pair} {...p} />
              ))}
            </div>
          )}
          {impacts.crypto.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-2">
                Crypto
              </p>
              {impacts.crypto.map((p) => (
                <PairRow key={p.pair} {...p} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
