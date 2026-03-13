import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import {
  useGetAnalytics,
  useGetExtendedAnalytics,
  useGetTrades,
} from "@/hooks/useQueries";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {
  computeEquityCurve,
  computePsychStats,
  computeRMultipleDistribution,
  computeSessionBreakdown,
  displaySession,
} from "@/utils/trade";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Building2,
  DollarSign,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ExtendedAnalytics,
  SentimentSummary,
  Trade,
  TradeSegment,
} from "../backend.d";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.FC<{ className?: string }>;
  positive?: boolean;
  negative?: boolean;
  loading?: boolean;
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  positive,
  negative,
  loading,
}: KPICardProps) {
  return (
    <Card className="bg-card border-border card-hover animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-7 w-20 bg-muted" />
            ) : (
              <p
                className={cn(
                  "text-2xl font-bold font-mono tabular-nums",
                  positive && "text-trade-win",
                  negative && "text-trade-loss",
                  !positive && !negative && "text-foreground",
                )}
              >
                {value}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "w-9 h-9 rounded-md flex items-center justify-center ml-3 shrink-0",
              positive && "bg-trade-win-muted",
              negative && "bg-trade-loss-muted",
              !positive && !negative && "bg-teal-muted",
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4",
                positive && "text-trade-win",
                negative && "text-trade-loss",
                !positive && !negative && "text-teal",
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Resolve a CSS custom property to a computed hex/rgb color string that SVG
 * stroke/fill attributes can consume reliably (SVG does not evaluate
 * oklch() in presentation attributes on all browsers).
 */
function resolveColor(varName: string): string {
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue(varName).trim();
  if (!raw) return "#888";
  // Create a temporary element to let the browser resolve oklch → computed rgb
  const tmp = document.createElement("div");
  tmp.style.color = `oklch(${raw})`;
  tmp.style.position = "absolute";
  tmp.style.opacity = "0";
  tmp.style.pointerEvents = "none";
  root.appendChild(tmp);
  const resolved = getComputedStyle(tmp).color;
  root.removeChild(tmp);
  // Fall back gracefully if browser doesn't resolve
  return resolved || `oklch(${raw})`;
}

function useChartColors() {
  const { theme } = useTheme();
  // Re-resolve on every theme change
  return {
    teal: resolveColor("--teal"),
    win: resolveColor("--trade-win"),
    loss: resolveColor("--trade-loss"),
    gold: resolveColor("--gold"),
    muted: resolveColor("--muted"),
    text: resolveColor("--muted-foreground"),
    _theme: theme,
  };
}

const CustomTooltip = ({
  active,
  payload,
  label,
  colors,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  label?: string;
  colors: ReturnType<typeof useChartColors>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: { name: string; value: number }) => (
          <p
            key={entry.name}
            className="font-mono font-semibold"
            style={{
              color:
                entry.name === "cumR"
                  ? colors.teal
                  : entry.name === "count"
                    ? entry.value >= 0
                      ? colors.win
                      : colors.loss
                    : colors.teal,
            }}
          >
            {entry.name === "cumR"
              ? `${entry.value > 0 ? "+" : ""}${entry.value}R`
              : `${entry.value} trades`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ---- Kelly Fraction calculation ----
function computeKelly(analytics: ExtendedAnalytics) {
  const W = analytics.winRate / 100;
  const avgWin = analytics.avgWin > 0 ? analytics.avgWin : 1;
  const avgLoss = analytics.avgLoss > 0 ? analytics.avgLoss : 1;
  // f* = W/avgLoss - (1-W)/avgWin
  const fStar = W / avgLoss - (1 - W) / avgWin;
  return Math.max(0, fStar);
}

// ---- Risk of Ruin calculation ----
function computeRiskOfRuin(analytics: ExtendedAnalytics, riskPerTrade: number) {
  const p = analytics.winRate / 100;
  const q = 1 - p;
  if (p <= 0 || q <= 0 || riskPerTrade <= 0) {
    return { ruin50: 0, ruinBlowup: 0, safeRisk: 2 };
  }
  const ratio = q / p;
  const steps50 = Math.max(1, Math.floor(0.5 / riskPerTrade));
  const steps100 = Math.max(1, Math.floor(1.0 / riskPerTrade));
  const ruin50 = Math.min(100, ratio ** steps50 * 100);
  const ruinBlowup = Math.min(100, ratio ** steps100 * 100);
  // Safe risk: keep ruin50 < 5%
  const safeRisk =
    analytics.profitFactor > 1
      ? Math.min(2, Math.max(0.5, analytics.expectancy * 2))
      : 0.5;
  return { ruin50, ruinBlowup, safeRisk };
}

// ---- Equity Curve Simulator ----
function computeEquityCurveSimulator(
  analytics: ExtendedAnalytics,
  startBalance: number,
  riskPct: number,
) {
  const winRate = analytics.winRate / 100;
  const avgRR = analytics.avgRR > 0 ? analytics.avgRR : 1;
  const r = riskPct / 100;
  const dataPoints = [0, 25, 50, 75, 100, 125, 150, 175, 200];
  return dataPoints.map((n) => {
    const expected =
      startBalance * (1 + r * winRate * avgRR - r * (1 - winRate)) ** n;
    const bestCase = startBalance * (1 + r * avgRR) ** n;
    const worstCase = startBalance * (1 - r) ** n;
    return {
      trade: n,
      expected: Math.round(expected),
      bestCase: Math.round(bestCase),
      worstCase: Math.round(worstCase),
    };
  });
}

// ---- Strategy Edge Stability ----
function computeEdgeStatus(segments: TradeSegment[]) {
  if (segments.length < 2) return "insufficient";
  const first = segments[0];
  const last = segments[segments.length - 1];
  const diff = last.winRate - first.winRate;
  if (diff > 5) return "improving";
  if (diff < -5) return "declining";
  return "stable";
}

const SENTIMENT_STYLES: Record<string, string> = {
  Bullish: "bg-trade-win/15 text-trade-win border-trade-win/30",
  Bearish: "bg-trade-loss/15 text-trade-loss border-trade-loss/30",
  Neutral: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

function InstitutionalSentimentWidget({
  onNavigate,
}: { onNavigate?: (page: string) => void }) {
  const { actor, isFetching: actorFetching } = useActor();
  const [summary, setSummary] = useState<SentimentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!actor) return;
    try {
      const result = await (actor as any).getInstitutionalSentimentSummary();
      setSummary(result);
    } catch {
      // silent
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || actorFetching) return;
    setLoading(true);
    fetchSummary().finally(() => setLoading(false));
  }, [actor, actorFetching, fetchSummary]);

  // Pick the dominant sentiment per currency
  const byCurrency = useMemo(() => {
    const map: Record<string, { sentiment: string; count: number }> = {};
    for (const item of summary) {
      const cnt = Number(item.count);
      if (!map[item.currency] || cnt > map[item.currency].count) {
        map[item.currency] = { sentiment: item.sentiment, count: cnt };
      }
    }
    return map;
  }, [summary]);

  const currencies = Object.keys(byCurrency);

  return (
    <Card
      className="bg-card border-border"
      data-ocid="institutional.sentiment.card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Institutional Sentiment
            </CardTitle>
          </div>
          {onNavigate && (
            <button
              type="button"
              className="text-xs text-teal hover:underline"
              onClick={() => onNavigate("institutional")}
              data-ocid="institutional.sentiment.link"
            >
              View All
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            className="space-y-2"
            data-ocid="institutional.sentiment.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : currencies.length === 0 ? (
          <p
            className="text-xs text-muted-foreground/60 text-center py-2"
            data-ocid="institutional.sentiment.empty_state"
          >
            No sentiment data yet
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {currencies.map((currency) => {
              const { sentiment } = byCurrency[currency];
              const style =
                SENTIMENT_STYLES[sentiment] ??
                "bg-muted text-muted-foreground border-border";
              return (
                <div
                  key={currency}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-background/50"
                >
                  <span className="text-xs font-semibold text-foreground">
                    {currency}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${style}`}
                  >
                    {sentiment}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: tradesData, isLoading: tradesLoading } = useGetTrades();
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics();
  const { data: extendedAnalytics, isLoading: extendedLoading } =
    useGetExtendedAnalytics();
  const CHART_COLORS = useChartColors();

  const trades: Trade[] = useMemo(() => {
    return tradesData ?? [];
  }, [tradesData]);

  const equityCurve = useMemo(() => computeEquityCurve(trades), [trades]);
  const rMultipleDist = useMemo(
    () => computeRMultipleDistribution(trades),
    [trades],
  );
  const sessionBreakdown = useMemo(
    () => computeSessionBreakdown(trades),
    [trades],
  );
  const psychStats = useMemo(() => computePsychStats(trades), [trades]);

  const loading = tradesLoading || analyticsLoading || extendedLoading;

  // Extended analytics derived values
  const totalTradeCount = extendedAnalytics
    ? Number(extendedAnalytics.totalTrades)
    : trades.length;

  const kellyFraction = useMemo(() => {
    if (!extendedAnalytics || totalTradeCount < 20) return null;
    return computeKelly(extendedAnalytics);
  }, [extendedAnalytics, totalTradeCount]);

  const kellyReliability = useMemo(() => {
    if (totalTradeCount < 20) return "insufficient";
    if (totalTradeCount < 50) return "low";
    if (totalTradeCount < 100) return "medium";
    return "high";
  }, [totalTradeCount]);

  const avgRiskPct = useMemo(() => {
    if (trades.length === 0) return 0.01;
    return trades.reduce((s, t) => s + t.riskPercent, 0) / trades.length / 100;
  }, [trades]);

  const riskOfRuinData = useMemo(() => {
    if (!extendedAnalytics || totalTradeCount < 10) return null;
    return computeRiskOfRuin(extendedAnalytics, avgRiskPct);
  }, [extendedAnalytics, totalTradeCount, avgRiskPct]);

  const startingBalance = useMemo(() => {
    for (let i = trades.length - 1; i >= 0; i--) {
      const bal = (trades[i] as Trade & { accountBalance?: number })
        .accountBalance;
      if (bal && bal > 0) return bal;
    }
    return 10000;
  }, [trades]);

  const equityCurveSimData = useMemo(() => {
    if (!extendedAnalytics || totalTradeCount < 5) return null;
    const riskPct = avgRiskPct * 100 || 1;
    return computeEquityCurveSimulator(
      extendedAnalytics,
      startingBalance,
      riskPct,
    );
  }, [extendedAnalytics, totalTradeCount, startingBalance, avgRiskPct]);

  const edgeStatus = useMemo(() => {
    if (!extendedAnalytics) return "insufficient";
    return computeEdgeStatus(extendedAnalytics.tradeSegments ?? []);
  }, [extendedAnalytics]);

  const winRate = analytics
    ? analytics.winRate
    : (trades.filter((t) => t.result === "Win").length /
        Math.max(trades.length, 1)) *
      100;
  const totalTrades = analytics ? Number(analytics.totalTrades) : trades.length;
  const avgRR = analytics
    ? analytics.avgRR
    : trades.reduce((s, t) => s + t.rrRatio, 0) / Math.max(trades.length, 1);
  const totalNetR = analytics
    ? analytics.totalNetR
    : trades.reduce((s, t) => s + t.rMultiple, 0);
  const totalPnlDollar = trades.reduce((s, t) => s + t.pnlDollar, 0);
  const profitFactor = analytics ? analytics.profitFactor : 0;
  const expectancy = analytics ? analytics.expectancy : 0;
  const avgRMultiple = analytics ? analytics.avgRMultiple : 0;
  const followedRulesPercent = analytics ? analytics.followedRulesPercent : 0;
  const exitedEarlyPercent = analytics ? analytics.exitedEarlyPercent : 0;
  const movedStopLossPercent = analytics ? analytics.movedStopLossPercent : 0;

  const equityCurvePositive =
    equityCurve.length > 0 && equityCurve[equityCurve.length - 1].cumR >= 0;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Performance overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-trade-win animate-pulse" />
          Live data
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
        <KPICard
          title="Total Trades"
          value={String(totalTrades)}
          icon={Activity}
          loading={loading}
        />
        <KPICard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          subtitle={`${trades.filter((t) => t.result === "Win").length}W / ${trades.filter((t) => t.result === "Loss").length}L`}
          icon={Trophy}
          positive={winRate >= 50}
          negative={winRate < 40}
          loading={loading}
        />
        <KPICard
          title="Avg R:R"
          value={`${avgRR.toFixed(2)}R`}
          icon={Target}
          positive={avgRR >= 2}
          negative={avgRR < 1}
          loading={loading}
        />
        <KPICard
          title="Total Net R"
          value={`${totalNetR >= 0 ? "+" : ""}${totalNetR.toFixed(2)}R`}
          icon={totalNetR >= 0 ? TrendingUp : TrendingDown}
          positive={totalNetR > 0}
          negative={totalNetR < 0}
          loading={loading}
        />
        <KPICard
          title="Total P&L ($)"
          value={
            totalPnlDollar >= 0
              ? `+$${totalPnlDollar.toFixed(2)}`
              : `-$${Math.abs(totalPnlDollar).toFixed(2)}`
          }
          icon={DollarSign}
          positive={totalPnlDollar > 0}
          negative={totalPnlDollar < 0}
          loading={loading}
        />
        <KPICard
          title="Profit Factor"
          value={profitFactor.toFixed(2)}
          icon={BarChart2}
          positive={profitFactor >= 1.5}
          negative={profitFactor < 1}
          loading={loading}
        />
        <KPICard
          title="Expectancy"
          value={`${expectancy >= 0 ? "+" : ""}${expectancy.toFixed(2)}R`}
          icon={Zap}
          positive={expectancy > 0}
          negative={expectancy < 0}
          loading={loading}
        />
        <KPICard
          title="Avg R-Multiple"
          value={`${avgRMultiple >= 0 ? "+" : ""}${avgRMultiple.toFixed(2)}R`}
          icon={TrendingUp}
          positive={avgRMultiple > 0}
          negative={avgRMultiple < 0}
          loading={loading}
        />
        <KPICard
          title="Rules Followed"
          value={`${followedRulesPercent.toFixed(0)}%`}
          icon={Target}
          positive={followedRulesPercent >= 80}
          negative={followedRulesPercent < 60}
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Equity Curve */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                Equity Curve
              </CardTitle>
              <span
                className={cn(
                  "text-xs font-mono font-bold",
                  equityCurvePositive ? "text-trade-win" : "text-trade-loss",
                )}
              >
                {equityCurve.length > 0
                  ? `${equityCurve[equityCurve.length - 1].cumR >= 0 ? "+" : ""}${equityCurve[equityCurve.length - 1].cumR}R`
                  : "—"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={equityCurve}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.muted}
                  vertical={false}
                />
                <XAxis
                  dataKey="index"
                  tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Trade #",
                    position: "insideBottom",
                    offset: -2,
                    fill: CHART_COLORS.text,
                    fontSize: 11,
                  }}
                />
                <YAxis
                  tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}R`}
                />
                <Tooltip content={<CustomTooltip colors={CHART_COLORS} />} />
                <ReferenceLine
                  y={0}
                  stroke={CHART_COLORS.text}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="cumR"
                  stroke={
                    equityCurvePositive ? CHART_COLORS.teal : CHART_COLORS.loss
                  }
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: equityCurvePositive
                      ? CHART_COLORS.teal
                      : CHART_COLORS.loss,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* R-Multiple Distribution */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-foreground">
              R-Multiple Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={rMultipleDist}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.muted}
                  vertical={false}
                />
                <XAxis
                  dataKey="bucket"
                  tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip colors={CHART_COLORS} />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {rMultipleDist.map((entry) => (
                    <Cell
                      key={`cell-${entry.bucket}`}
                      fill={
                        entry.bucket.startsWith("<") ||
                        entry.bucket.startsWith("-")
                          ? CHART_COLORS.loss
                          : entry.bucket === "0R to 1R"
                            ? CHART_COLORS.text
                            : CHART_COLORS.win
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics: Kelly + Risk of Ruin + Equity Sim + Edge Stability */}

      {/* Advanced Analytics row 1: Kelly + Risk of Ruin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Session Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-foreground">
              Session Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-1 text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                <span>Session</span>
                <span className="text-center">Trades</span>
                <span className="text-center">Win%</span>
                <span className="text-center">Avg RR</span>
              </div>
              {sessionBreakdown.map((row) => (
                <div
                  key={row.session}
                  className="grid grid-cols-4 gap-1 text-xs items-center"
                >
                  <span className="font-medium text-foreground">
                    {displaySession(row.session)}
                  </span>
                  <span className="text-center font-mono text-muted-foreground">
                    {row.trades}
                  </span>
                  <span
                    className={cn(
                      "text-center font-mono font-semibold",
                      row.winRate >= 50
                        ? "text-trade-win"
                        : row.winRate >= 40
                          ? "text-gold"
                          : "text-trade-loss",
                    )}
                  >
                    {row.winRate}%
                  </span>
                  <span
                    className={cn(
                      "text-center font-mono",
                      row.avgRR >= 2
                        ? "text-trade-win"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.avgRR}R
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Psychology Stats */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-foreground">
              Psychology Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {psychStats.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No psychology data yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {psychStats.slice(0, 6).map((stat) => (
                  <div key={stat.emotion} className="flex items-center gap-2">
                    <span className="text-xs text-foreground w-28 truncate shrink-0">
                      {stat.emotion}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          stat.winRate >= 60
                            ? "bg-trade-win"
                            : stat.winRate >= 40
                              ? "bg-gold"
                              : "bg-trade-loss",
                        )}
                        style={{ width: `${stat.winRate}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-mono font-semibold w-10 text-right shrink-0",
                        stat.winRate >= 60
                          ? "text-trade-win"
                          : stat.winRate >= 40
                            ? "text-gold"
                            : "text-trade-loss",
                      )}
                    >
                      {stat.winRate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discipline Metrics */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-foreground">
              Discipline Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Rules Followed</span>
                <span className="font-mono font-semibold text-trade-win">
                  {followedRulesPercent.toFixed(0)}%
                </span>
              </div>
              <div className="bg-muted rounded-full h-1.5">
                <div
                  className="bg-trade-win h-full rounded-full transition-all"
                  style={{ width: `${followedRulesPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Early Exits</span>
                <span
                  className={cn(
                    "font-mono font-semibold",
                    exitedEarlyPercent > 30 ? "text-trade-loss" : "text-gold",
                  )}
                >
                  {exitedEarlyPercent.toFixed(0)}%
                </span>
              </div>
              <div className="bg-muted rounded-full h-1.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    exitedEarlyPercent > 30 ? "bg-trade-loss" : "bg-gold",
                  )}
                  style={{ width: `${exitedEarlyPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Moved Stop Loss</span>
                <span
                  className={cn(
                    "font-mono font-semibold",
                    movedStopLossPercent > 30 ? "text-trade-loss" : "text-gold",
                  )}
                >
                  {movedStopLossPercent.toFixed(0)}%
                </span>
              </div>
              <div className="bg-muted rounded-full h-1.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    movedStopLossPercent > 30 ? "bg-trade-loss" : "bg-gold",
                  )}
                  style={{ width: `${movedStopLossPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics: Kelly + Risk of Ruin */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Kelly Fraction */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                Kelly Fraction
              </CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold border",
                  kellyReliability === "insufficient" &&
                    "border-muted-foreground/30 text-muted-foreground",
                  kellyReliability === "low" &&
                    "border-amber-500/50 text-amber-500 bg-amber-500/10",
                  kellyReliability === "medium" &&
                    "border-gold/50 text-gold bg-gold-muted",
                  kellyReliability === "high" &&
                    "border-trade-win/50 text-trade-win bg-trade-win-muted",
                )}
              >
                {kellyReliability === "insufficient" &&
                  `Need 20+ trades (${totalTradeCount} logged)`}
                {kellyReliability === "low" &&
                  `Low Reliability (${totalTradeCount} trades)`}
                {kellyReliability === "medium" &&
                  `Medium Reliability (${totalTradeCount} trades)`}
                {kellyReliability === "high" &&
                  `High Reliability (${totalTradeCount} trades)`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {kellyReliability === "insufficient" ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <BarChart2 className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Log at least 20 trades to unlock Kelly Fraction
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Kelly requires sufficient trade history for statistical
                  reliability
                </p>
              </div>
            ) : kellyFraction !== null ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-md p-3 border border-border text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      Full Kelly
                    </p>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {(kellyFraction * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-teal-muted rounded-md p-3 border border-teal/30 text-center relative">
                    <p className="text-[10px] text-teal uppercase tracking-wider mb-1">
                      Half Kelly ★
                    </p>
                    <p className="text-lg font-bold font-mono text-teal">
                      {((kellyFraction / 2) * 100).toFixed(2)}%
                    </p>
                    <span className="absolute -top-2 right-2 text-[9px] bg-teal text-white px-1.5 py-0.5 rounded-full font-semibold">
                      Recommended
                    </span>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 border border-border text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      Quarter Kelly
                    </p>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {((kellyFraction / 4) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Based on Win Rate: {extendedAnalytics?.winRate.toFixed(1)}% ·
                  Avg Win: {extendedAnalytics?.avgWin.toFixed(2)}R · Avg Loss:{" "}
                  {extendedAnalytics?.avgLoss.toFixed(2)}R
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Risk of Ruin */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-foreground">
              Risk of Ruin
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {!riskOfRuinData ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <AlertTriangle className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Log at least 10 trades to unlock Risk of Ruin
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={cn(
                      "rounded-md p-3 border text-center",
                      riskOfRuinData.ruin50 > 20
                        ? "bg-trade-loss-muted border-trade-loss/30"
                        : riskOfRuinData.ruin50 > 5
                          ? "bg-gold-muted border-gold/30"
                          : "bg-trade-win-muted border-trade-win/30",
                    )}
                  >
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      50% Drawdown
                    </p>
                    <p
                      className={cn(
                        "text-lg font-bold font-mono",
                        riskOfRuinData.ruin50 > 20
                          ? "text-trade-loss"
                          : riskOfRuinData.ruin50 > 5
                            ? "text-gold"
                            : "text-trade-win",
                      )}
                    >
                      {riskOfRuinData.ruin50.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      probability
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-md p-3 border text-center",
                      riskOfRuinData.ruinBlowup > 5
                        ? "bg-trade-loss-muted border-trade-loss/30"
                        : riskOfRuinData.ruinBlowup > 1
                          ? "bg-gold-muted border-gold/30"
                          : "bg-trade-win-muted border-trade-win/30",
                    )}
                  >
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      Account Blowup
                    </p>
                    <p
                      className={cn(
                        "text-lg font-bold font-mono",
                        riskOfRuinData.ruinBlowup > 5
                          ? "text-trade-loss"
                          : riskOfRuinData.ruinBlowup > 1
                            ? "text-gold"
                            : "text-trade-win",
                      )}
                    >
                      {riskOfRuinData.ruinBlowup.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      probability
                    </p>
                  </div>
                  <div className="bg-teal-muted rounded-md p-3 border border-teal/30 text-center">
                    <p className="text-[10px] text-teal uppercase tracking-wider mb-1">
                      Safe Risk
                    </p>
                    <p className="text-lg font-bold font-mono text-teal">
                      {riskOfRuinData.safeRisk.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-teal/70">per trade</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Based on avg risk {(avgRiskPct * 100).toFixed(2)}% per trade ·
                  Profit Factor:{" "}
                  {(extendedAnalytics?.profitFactor ?? 0).toFixed(2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics row 2: Equity Curve Simulator + Strategy Edge */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Equity Curve Simulator */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                Equity Curve Simulator
              </CardTitle>
              <span className="text-[10px] text-muted-foreground">
                Projected growth · {(avgRiskPct * 100).toFixed(1)}% risk/trade
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {!equityCurveSimData ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Log at least 5 trades to unlock the Equity Curve Simulator
                </p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={equityCurveSimData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={CHART_COLORS.muted}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="trade"
                      tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}`}
                    />
                    <YAxis
                      tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) =>
                        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        fontSize: "11px",
                      }}
                      formatter={(v: number, name: string) => [
                        `$${v.toLocaleString()}`,
                        name === "expected"
                          ? "Expected"
                          : name === "bestCase"
                            ? "Best Case"
                            : "Worst Case",
                      ]}
                      labelFormatter={(l) => `After ${l} trades`}
                    />
                    <Line
                      type="monotone"
                      dataKey="expected"
                      stroke={CHART_COLORS.teal}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bestCase"
                      stroke={CHART_COLORS.win}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="worstCase"
                      stroke={CHART_COLORS.loss}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-teal rounded" />
                    <span className="text-[10px] text-muted-foreground">
                      Expected
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-0.5 bg-trade-win rounded"
                      style={{ borderTop: "2px dashed" }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Best Case
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-0.5 bg-trade-loss rounded"
                      style={{ borderTop: "2px dashed" }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Worst Case
                    </span>
                  </div>
                </div>
                {/* Summary projections */}
                <div className="grid grid-cols-3 gap-2 mt-2 px-2">
                  {[50, 100, 200].map((n) => {
                    const pt = equityCurveSimData.find((d) => d.trade === n);
                    if (!pt) return null;
                    const pct =
                      ((pt.expected - startingBalance) / startingBalance) * 100;
                    return (
                      <div
                        key={n}
                        className="bg-muted/50 rounded-md p-2 border border-border text-center"
                      >
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          After {n} trades
                        </p>
                        <p
                          className={cn(
                            "text-sm font-bold font-mono",
                            pt.expected >= startingBalance
                              ? "text-trade-win"
                              : "text-trade-loss",
                          )}
                        >
                          ${pt.expected.toLocaleString()}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] font-mono",
                            pct >= 0 ? "text-trade-win" : "text-trade-loss",
                          )}
                        >
                          {pct >= 0 ? "+" : ""}
                          {pct.toFixed(1)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Strategy Edge Stability */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                Strategy Edge Stability
              </CardTitle>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                  edgeStatus === "improving" &&
                    "bg-trade-win-muted border-trade-win/30 text-trade-win",
                  edgeStatus === "declining" &&
                    "bg-trade-loss-muted border-trade-loss/30 text-trade-loss",
                  edgeStatus === "stable" &&
                    "bg-teal-muted border-teal/30 text-teal",
                  edgeStatus === "insufficient" &&
                    "bg-muted border-muted-foreground/20 text-muted-foreground",
                )}
              >
                {edgeStatus === "improving" && (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    Improving
                  </>
                )}
                {edgeStatus === "declining" && (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    Declining
                  </>
                )}
                {edgeStatus === "stable" && (
                  <>
                    <Activity className="w-3 h-3" />
                    Stable
                  </>
                )}
                {edgeStatus === "insufficient" && "Insufficient Data"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {edgeStatus === "declining" && (
              <div className="mx-2 mb-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-500">
                  Strategy edge may be weakening. Recent performance is
                  declining compared to earlier trades.
                </p>
              </div>
            )}
            {!extendedAnalytics ||
            !extendedAnalytics.tradeSegments ||
            extendedAnalytics.tradeSegments.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <Activity className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Keep logging trades to unlock edge analysis
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Requires at least 2 segments (~100 trades) for comparison
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={extendedAnalytics.tradeSegments.map((s) => ({
                    name: s.segmentLabel,
                    winRate: s.winRate,
                    avgRR: s.avgRR,
                  }))}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_COLORS.muted}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                    formatter={(v: number, name: string) => [
                      name === "winRate"
                        ? `${v.toFixed(1)}%`
                        : `${v.toFixed(2)}R`,
                      name === "winRate" ? "Win Rate" : "Avg R:R",
                    ]}
                  />
                  <Bar dataKey="winRate" radius={[3, 3, 0, 0]}>
                    {extendedAnalytics.tradeSegments.map((seg, idx) => (
                      <Cell
                        key={`cell-${seg.segmentLabel}`}
                        fill={
                          idx === extendedAnalytics.tradeSegments.length - 1
                            ? edgeStatus === "improving"
                              ? CHART_COLORS.win
                              : edgeStatus === "declining"
                                ? CHART_COLORS.loss
                                : CHART_COLORS.teal
                            : CHART_COLORS.text
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Institutional Sentiment Widget */}
      <InstitutionalSentimentWidget onNavigate={undefined} />
    </div>
  );
}
