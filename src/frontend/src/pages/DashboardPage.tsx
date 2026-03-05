import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAnalytics, useGetTrades } from "@/hooks/useQueries";
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
  BarChart2,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
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
import type { Trade } from "../backend.d";

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

export default function DashboardPage() {
  const { data: tradesData, isLoading: tradesLoading } = useGetTrades();
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics();
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

  const loading = tradesLoading || analyticsLoading;

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

      {/* Bottom row: Session breakdown + Psychology + Discipline */}
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
    </div>
  );
}
