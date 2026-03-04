import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetTrades } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { displayGrade, displaySession } from "@/utils/trade";
import {
  AlertTriangle,
  Award,
  Brain,
  CalendarDays,
  Info,
  ShieldAlert,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import type { Trade } from "../backend.d";

interface Insight {
  id: string;
  icon: React.FC<{ className?: string }>;
  severity: "critical" | "warning" | "positive" | "info";
  title: string;
  finding: string;
  suggestion: string;
}

function computeInsights(trades: Trade[]): Insight[] {
  if (trades.length < 5) return [];
  const insights: Insight[] = [];
  const overallWinRate =
    (trades.filter((t) => t.result === "Win").length / trades.length) * 100;

  // 1. Session Performance
  const sessions = ["Asian", "London", "NewYork"];
  for (const session of sessions) {
    const st = trades.filter((t) => t.session === session);
    if (st.length >= 3) {
      const wr =
        (st.filter((t) => t.result === "Win").length / st.length) * 100;
      if (wr < 40) {
        insights.push({
          id: `session-${session}`,
          icon: AlertTriangle,
          severity: "critical",
          title: `${displaySession(session)} Session Danger Zone`,
          finding: `You lose ${(100 - wr).toFixed(0)}% of trades taken in ${displaySession(session)} (${wr.toFixed(0)}% win rate on ${st.length} trades).`,
          suggestion: `Consider avoiding ${displaySession(session)} trades entirely, or only trade A++ setups in this session.`,
        });
      } else if (wr >= 60) {
        insights.push({
          id: `session-best-${session}`,
          icon: TrendingUp,
          severity: "positive",
          title: `${displaySession(session)} Is Your Best Session`,
          finding: `Your ${displaySession(session)} win rate is ${wr.toFixed(0)}% — significantly above your average of ${overallWinRate.toFixed(0)}%.`,
          suggestion: `Double down on ${displaySession(session)} setups. This is your edge.`,
        });
      }
    }
  }

  // 2. Calm vs overall
  const calmTrades = trades.filter((t) => t.psychBefore.includes("Calm"));
  if (calmTrades.length >= 3) {
    const calmWR =
      (calmTrades.filter((t) => t.result === "Win").length /
        calmTrades.length) *
      100;
    if (calmWR > overallWinRate + 15) {
      insights.push({
        id: "psychology-calm",
        icon: Brain,
        severity: "positive",
        title: "Calm Mind = Best Performance",
        finding: `When calm, you win ${calmWR.toFixed(0)}% of trades vs ${overallWinRate.toFixed(0)}% overall (${(calmWR - overallWinRate).toFixed(0)}% improvement).`,
        suggestion:
          "Implement a pre-trade routine: deep breathing, journaling, or meditation before every session.",
      });
    }
  }

  // 3. FOMO analysis
  const fomoTrades = trades.filter((t) => t.psychBefore.includes("FOMO"));
  if (fomoTrades.length >= 3) {
    const fomoLossRate =
      (fomoTrades.filter((t) => t.result === "Loss").length /
        fomoTrades.length) *
      100;
    if (fomoLossRate > 50) {
      insights.push({
        id: "psychology-fomo",
        icon: ShieldAlert,
        severity: "critical",
        title: "FOMO Is Destroying Your Account",
        finding: `${fomoLossRate.toFixed(0)}% of FOMO-triggered trades are losses (${fomoTrades.length} trades). You're chasing the market.`,
        suggestion:
          "Walk away from the screen when you feel FOMO. If you missed the move, the next setup will come.",
      });
    }
  }

  // 4. Revenge mindset
  const revengeTrades = trades.filter((t) =>
    t.psychBefore.includes("Revenge mindset"),
  );
  if (revengeTrades.length >= 2) {
    const revengeWR =
      (revengeTrades.filter((t) => t.result === "Win").length /
        revengeTrades.length) *
      100;
    insights.push({
      id: "psychology-revenge",
      icon: ShieldAlert,
      severity: "critical",
      title: "Revenge Trading Pattern Detected",
      finding: `You've taken ${revengeTrades.length} revenge trades with only ${revengeWR.toFixed(0)}% win rate — typically your worst trades.`,
      suggestion:
        "After a loss, close your platform for at least 2 hours. Set a strict daily loss limit.",
    });
  }

  // 5. Grade Analysis
  const topGradeTrades = trades.filter(
    (t) => t.setupGrade === "App" || t.setupGrade === "Ap",
  );
  const lowGradeTrades = trades.filter(
    (t) => t.setupGrade === "B" || t.setupGrade === "C",
  );
  if (topGradeTrades.length >= 3 && lowGradeTrades.length >= 3) {
    const topWR =
      (topGradeTrades.filter((t) => t.result === "Win").length /
        topGradeTrades.length) *
      100;
    const lowWR =
      (lowGradeTrades.filter((t) => t.result === "Win").length /
        lowGradeTrades.length) *
      100;
    if (topWR > lowWR + 20) {
      insights.push({
        id: "grade-analysis",
        icon: Award,
        severity: "warning",
        title: "Stop Taking B/C Grade Setups",
        finding: `A+/A++ setups: ${topWR.toFixed(0)}% win rate. B/C grade setups: ${lowWR.toFixed(0)}% win rate. The gap is ${(topWR - lowWR).toFixed(0)}%.`,
        suggestion: `Only take A+ or A++ setups. B/C grade setups are sabotaging your overall win rate by ${(topWR - overallWinRate).toFixed(0)}%.`,
      });
    }
  }

  // 6. Rules followed vs not
  const rulesFollowedTrades = trades.filter((t) => t.followedRules);
  const rulesViolatedTrades = trades.filter((t) => !t.followedRules);
  if (rulesFollowedTrades.length >= 3 && rulesViolatedTrades.length >= 2) {
    const followedWR =
      (rulesFollowedTrades.filter((t) => t.result === "Win").length /
        rulesFollowedTrades.length) *
      100;
    const violatedWR =
      (rulesViolatedTrades.filter((t) => t.result === "Win").length /
        rulesViolatedTrades.length) *
      100;
    if (followedWR > violatedWR + 15) {
      insights.push({
        id: "discipline-rules",
        icon: Target,
        severity: "warning",
        title: "Your Rules Exist For a Reason",
        finding: `When following rules: ${followedWR.toFixed(0)}% win rate. When breaking rules: ${violatedWR.toFixed(0)}% win rate. You're ${(followedWR - violatedWR).toFixed(0)}% better when disciplined.`,
        suggestion:
          "Print your trading rules and read them before every session. Trust the process you spent months building.",
      });
    }
  }

  // 7. Early exits
  const earlyExitTrades = trades.filter((t) => t.exitedEarly);
  if (earlyExitTrades.length >= 3) {
    const avgEarlyR =
      earlyExitTrades.reduce((s, t) => s + t.rMultiple, 0) /
      earlyExitTrades.length;
    const avgNormalR =
      trades
        .filter((t) => !t.exitedEarly)
        .reduce((s, t) => s + t.rMultiple, 0) /
      Math.max(trades.filter((t) => !t.exitedEarly).length, 1);
    if (avgNormalR > avgEarlyR + 0.5) {
      insights.push({
        id: "early-exit",
        icon: Timer,
        severity: "warning",
        title: "Early Exits Are Costing You R",
        finding: `Early exits average ${avgEarlyR.toFixed(2)}R vs ${avgNormalR.toFixed(2)}R when you let trades run. You're leaving money on the table.`,
        suggestion:
          "Once in profit, move to breakeven only. Let the market take you out at your planned target.",
      });
    }
  }

  // 8. Best setup types
  const setupTypeMap: Record<string, { wins: number; total: number }> = {};
  for (const t of trades) {
    if (t.setupType) {
      if (!setupTypeMap[t.setupType])
        setupTypeMap[t.setupType] = { wins: 0, total: 0 };
      setupTypeMap[t.setupType].total++;
      if (t.result === "Win") setupTypeMap[t.setupType].wins++;
    }
  }
  const rankedSetups = Object.entries(setupTypeMap)
    .filter(([, s]) => s.total >= 2)
    .map(([type, s]) => ({
      type,
      winRate: (s.wins / s.total) * 100,
      total: s.total,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  if (rankedSetups.length >= 2) {
    const best = rankedSetups[0];
    const worst = rankedSetups[rankedSetups.length - 1];
    insights.push({
      id: "setup-ranking",
      icon: Zap,
      severity: "info",
      title: "Setup Performance Ranking",
      finding: `Best: "${best.type}" (${best.winRate.toFixed(0)}% WR, ${best.total} trades). Worst: "${worst.type}" (${worst.winRate.toFixed(0)}% WR, ${worst.total} trades).`,
      suggestion: `Focus on "${best.type}" setups and minimize "${worst.type}" until you improve that edge.`,
    });
  }

  return insights;
}

const SEVERITY_STYLES = {
  critical: {
    border: "border-trade-loss/30",
    bg: "bg-trade-loss-muted/50",
    iconBg: "bg-trade-loss-muted",
    iconColor: "text-trade-loss",
    badge: "bg-trade-loss-muted border-trade-loss/30 text-trade-loss",
    suggestionColor: "text-gold",
  },
  warning: {
    border: "border-gold/30",
    bg: "bg-gold-muted/30",
    iconBg: "bg-gold-muted",
    iconColor: "text-gold",
    badge: "bg-gold-muted border-gold/30 text-gold",
    suggestionColor: "text-teal",
  },
  positive: {
    border: "border-trade-win/30",
    bg: "bg-trade-win-muted/50",
    iconBg: "bg-trade-win-muted",
    iconColor: "text-trade-win",
    badge: "bg-trade-win-muted border-trade-win/30 text-trade-win",
    suggestionColor: "text-teal",
  },
  info: {
    border: "border-teal/30",
    bg: "bg-teal-muted/30",
    iconBg: "bg-teal-muted",
    iconColor: "text-teal",
    badge: "bg-teal-muted border-teal/30 text-teal",
    suggestionColor: "text-gold",
  },
};

const SEVERITY_LABELS = {
  critical: "🔴 Critical",
  warning: "🟡 Warning",
  positive: "🟢 Strength",
  info: "🔵 Insight",
};

function InsightCard({ insight }: { insight: Insight }) {
  const styles = SEVERITY_STYLES[insight.severity];
  const Icon = insight.icon;

  return (
    <Card
      data-ocid="review.brutal_mode.card"
      className={cn(
        "border animate-fade-in card-hover",
        styles.border,
        styles.bg,
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-md flex items-center justify-center shrink-0 mt-0.5",
              styles.iconBg,
            )}
          >
            <Icon className={cn("w-4 h-4", styles.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-sm text-foreground">
                {insight.title}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 border shrink-0",
                  styles.badge,
                )}
              >
                {SEVERITY_LABELS[insight.severity]}
              </Badge>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-2">
              {insight.finding}
            </p>
            <div
              className={cn(
                "text-xs font-medium leading-relaxed",
                styles.suggestionColor,
              )}
            >
              💡 {insight.suggestion}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklySummary({ trades }: { trades: Trade[] }) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekKey = weekAgo.toISOString().split("T")[0];

  const weeklyTrades = trades.filter((t) => t.date >= weekKey);
  const wins = weeklyTrades.filter((t) => t.result === "Win").length;
  const losses = weeklyTrades.filter((t) => t.result === "Loss").length;
  const netR = weeklyTrades.reduce((s, t) => s + t.rMultiple, 0);
  const bestTrade = weeklyTrades.sort((a, b) => b.rMultiple - a.rMultiple)[0];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-teal" />
          Last 7 Days Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {weeklyTrades.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No trades in the last 7 days.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Trades
              </p>
              <p className="text-xl font-bold font-mono">
                {weeklyTrades.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                W / L
              </p>
              <p className="text-xl font-bold font-mono">
                <span className="text-trade-win">{wins}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-trade-loss">{losses}</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Net R
              </p>
              <p
                className={cn(
                  "text-xl font-bold font-mono",
                  netR >= 0 ? "text-trade-win" : "text-trade-loss",
                )}
              >
                {netR >= 0 ? "+" : ""}
                {netR.toFixed(2)}R
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Best Trade
              </p>
              {bestTrade ? (
                <div>
                  <p className="font-bold text-sm font-mono">
                    {bestTrade.symbol}
                  </p>
                  <p className="text-xs text-trade-win font-mono">
                    +{bestTrade.rMultiple.toFixed(2)}R
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReviewPage() {
  const { data: tradesData } = useGetTrades();
  const trades: Trade[] = useMemo(() => {
    return tradesData ?? [];
  }, [tradesData]);

  const insights = useMemo(() => computeInsights(trades), [trades]);

  const criticals = insights.filter((i) => i.severity === "critical");
  const warnings = insights.filter((i) => i.severity === "warning");
  const positives = insights.filter((i) => i.severity === "positive");
  const infos = insights.filter((i) => i.severity === "info");

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-trade-loss" />
          <h1 className="text-xl font-bold">Brutal Review Mode</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-powered pattern analysis based on your trade history
        </p>
      </div>

      {/* Not enough data */}
      {trades.length < 5 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="py-12 text-center">
            <Info className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">
              Not enough data yet
            </p>
            <p className="text-sm text-muted-foreground">
              Log at least 5 trades to unlock pattern analysis.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You have {trades.length} trade{trades.length !== 1 ? "s" : ""} so
              far.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-trade-loss-muted/40 border border-trade-loss/20 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-trade-loss">
                {criticals.length}
              </p>
              <p className="text-xs text-muted-foreground">Critical Issues</p>
            </div>
            <div className="bg-gold-muted/40 border border-gold/20 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-gold">{warnings.length}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
            <div className="bg-trade-win-muted/40 border border-trade-win/20 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-trade-win">
                {positives.length}
              </p>
              <p className="text-xs text-muted-foreground">Strengths</p>
            </div>
            <div className="bg-teal-muted/40 border border-teal/20 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-teal">{infos.length}</p>
              <p className="text-xs text-muted-foreground">Insights</p>
            </div>
          </div>

          {/* Weekly summary */}
          <WeeklySummary trades={trades} />

          {/* Insights */}
          <div className="space-y-3 stagger-children">
            {[...criticals, ...warnings, ...positives, ...infos].map(
              (insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ),
            )}
            {insights.length === 0 && (
              <Card className="bg-card border-border">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No notable patterns detected yet. Keep logging trades!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Grade breakdown table */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold">
                Performance by Setup Grade
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-5 gap-1 text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
                <span>Grade</span>
                <span className="text-center">Trades</span>
                <span className="text-center">Win%</span>
                <span className="text-center">Avg R</span>
                <span className="text-center">Net R</span>
              </div>
              {["App", "Ap", "A", "B", "C"].map((grade) => {
                const gt = trades.filter((t) => t.setupGrade === grade);
                if (gt.length === 0) return null;
                const wr =
                  (gt.filter((t) => t.result === "Win").length / gt.length) *
                  100;
                const avgR =
                  gt.reduce((s, t) => s + t.rMultiple, 0) / gt.length;
                const netR = gt.reduce((s, t) => s + t.rMultiple, 0);
                return (
                  <div
                    key={grade}
                    className="grid grid-cols-5 gap-1 text-xs items-center py-1.5 border-t border-border/50"
                  >
                    <span className="font-bold text-gold">
                      {displayGrade(grade)}
                    </span>
                    <span className="text-center font-mono text-muted-foreground">
                      {gt.length}
                    </span>
                    <span
                      className={cn(
                        "text-center font-mono font-semibold",
                        wr >= 50 ? "text-trade-win" : "text-trade-loss",
                      )}
                    >
                      {wr.toFixed(0)}%
                    </span>
                    <span
                      className={cn(
                        "text-center font-mono",
                        avgR >= 0 ? "text-trade-win" : "text-trade-loss",
                      )}
                    >
                      {avgR >= 0 ? "+" : ""}
                      {avgR.toFixed(2)}R
                    </span>
                    <span
                      className={cn(
                        "text-center font-mono",
                        netR >= 0 ? "text-trade-win" : "text-trade-loss",
                      )}
                    >
                      {netR >= 0 ? "+" : ""}
                      {netR.toFixed(2)}R
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
