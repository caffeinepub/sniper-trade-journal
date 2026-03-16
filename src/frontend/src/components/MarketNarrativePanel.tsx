import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { MarketNarrative } from "../utils/macroIntelligence";

interface MarketNarrativePanelProps {
  narrative: MarketNarrative;
}

const CONFIDENCE_STYLES = {
  High: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Low: "bg-muted text-muted-foreground border-border",
};

export default function MarketNarrativePanel({
  narrative,
}: MarketNarrativePanelProps) {
  return (
    <Card className="bg-card border-border" data-ocid="narrative.panel">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-teal" />
          <CardTitle className="text-sm font-semibold text-foreground">
            Current Market Narrative
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xl font-bold text-foreground">
            {narrative.title}
          </span>
          <Badge
            variant="outline"
            className={`text-xs ${CONFIDENCE_STYLES[narrative.confidence]}`}
          >
            {narrative.confidence} Confidence
          </Badge>
        </div>

        {narrative.drivers.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1.5">
              Key Drivers
            </p>
            <ul className="space-y-1">
              {narrative.drivers.map((driver) => (
                <li
                  key={driver}
                  className="flex items-center gap-2 text-sm text-foreground/80"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-teal flex-shrink-0" />
                  {driver}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg bg-background/50 border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {narrative.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
