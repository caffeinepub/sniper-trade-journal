import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useGetExtendedAnalytics, useGetTrades } from "@/hooks/useQueries";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Dices,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
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

// Re-use the resolveColor helper that's present in DashboardPage
function resolveColor(varName: string): string {
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue(varName).trim();
  if (!raw) return "#888";
  const tmp = document.createElement("div");
  tmp.style.color = `oklch(${raw})`;
  tmp.style.position = "absolute";
  tmp.style.opacity = "0";
  tmp.style.pointerEvents = "none";
  root.appendChild(tmp);
  const resolved = getComputedStyle(tmp).color;
  root.removeChild(tmp);
  return resolved || `oklch(${raw})`;
}

function useChartColors() {
  const { theme } = useTheme();
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

// Percentile helper
function percentile(sorted: number[], p: number): number {
  const idx = Math.floor((p / 100) * sorted.length);
  return sorted[Math.min(idx, sorted.length - 1)];
}

interface SimResults {
  medianFinal: number;
  p5Final: number;
  p95Final: number;
  medianMaxDrawdown: number;
  medianLongestStreak: number;
  percentProfitable: number;
  histogram: { bucket: string; count: number; aboveStart: boolean }[];
  p5Curve: { trade: number; balance: number }[];
  medianCurve: { trade: number; balance: number }[];
  p95Curve: { trade: number; balance: number }[];
}

const NUM_SIMS = 10_000;
const CURVE_SAMPLE = 10; // sample every N trades for the equity curves

export default function MonteCarloPage() {
  const { data: tradesData } = useGetTrades();
  const { data: extendedAnalytics } = useGetExtendedAnalytics();
  const CHART_COLORS = useChartColors();

  const trades = tradesData ?? [];

  const derivedRiskPct = useMemo(() => {
    if (trades.length === 0) return 1;
    return trades.reduce((s, t) => s + t.riskPercent, 0) / trades.length;
  }, [trades]);

  const derivedStartBalance = useMemo(() => {
    for (let i = trades.length - 1; i >= 0; i--) {
      const bal = (trades[i] as { accountBalance?: number }).accountBalance;
      if (bal && bal > 0) return bal;
    }
    return 10000;
  }, [trades]);

  const [numTrades, setNumTrades] = useState("100");
  const [startBalance, setStartBalance] = useState("");
  const [riskPct, setRiskPct] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SimResults | null>(null);
  const abortRef = useRef(false);

  const effectiveStart = Number.parseFloat(startBalance) || derivedStartBalance;
  const effectiveRisk = Number.parseFloat(riskPct) || derivedRiskPct;
  const effectiveTrades = Math.max(
    50,
    Math.min(500, Number.parseInt(numTrades) || 100),
  );

  const winRate = extendedAnalytics
    ? extendedAnalytics.winRate / 100
    : trades.filter((t) => t.result === "Win").length /
      Math.max(trades.length, 1);
  const avgRR = extendedAnalytics?.avgRR ?? 1;

  const hasEnoughTrades = trades.length >= 10;

  const runSimulation = useCallback(async () => {
    if (!hasEnoughTrades) return;
    abortRef.current = false;
    setRunning(true);
    setProgress(0);
    setResults(null);

    const r = effectiveRisk / 100;
    const n = effectiveTrades;
    const startBal = effectiveStart;

    const finalBalances: number[] = new Array(NUM_SIMS);
    const maxDrawdowns: number[] = new Array(NUM_SIMS);
    const longestStreaks: number[] = new Array(NUM_SIMS);

    // We'll track curve data for sampled trades
    const samplePoints: number[] = [];
    for (let i = 0; i <= n; i += CURVE_SAMPLE) samplePoints.push(i);
    if (samplePoints[samplePoints.length - 1] !== n) samplePoints.push(n);

    // Per-sample-point array of balances across all sims
    const curveMatrix: number[][] = samplePoints.map(() =>
      new Array(NUM_SIMS).fill(0),
    );

    const CHUNK_SIZE = 100;
    let simIdx = 0;

    const runChunk = () =>
      new Promise<void>((resolve) => {
        for (let c = 0; c < CHUNK_SIZE && simIdx < NUM_SIMS; c++, simIdx++) {
          let bal = startBal;
          let peak = bal;
          let maxDD = 0;
          let longest = 0;
          let streak = 0;

          // Record trade 0
          curveMatrix[0][simIdx] = bal;
          let nextSample = samplePoints[1] ?? n + 1;
          let sampleI2 = 1;

          for (let t = 1; t <= n; t++) {
            const win = Math.random() < winRate;
            if (win) {
              bal *= 1 + r * avgRR;
              streak = 0;
            } else {
              bal *= 1 - r;
              streak++;
              if (streak > longest) longest = streak;
            }
            if (bal > peak) peak = bal;
            const dd = (peak - bal) / peak;
            if (dd > maxDD) maxDD = dd;

            if (t === nextSample) {
              curveMatrix[sampleI2][simIdx] = bal;
              sampleI2++;
              nextSample = samplePoints[sampleI2] ?? n + 1;
            }
          }

          finalBalances[simIdx] = bal;
          maxDrawdowns[simIdx] = maxDD * 100;
          longestStreaks[simIdx] = longest;
        }
        resolve();
      });

    while (simIdx < NUM_SIMS && !abortRef.current) {
      await runChunk();
      setProgress(Math.floor((simIdx / NUM_SIMS) * 100));
      // yield to browser
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    }

    if (abortRef.current) {
      setRunning(false);
      return;
    }

    // Sort finals for percentiles
    const sortedFinals = [...finalBalances].sort((a, b) => a - b);
    const sortedDD = [...maxDrawdowns].sort((a, b) => a - b);
    const sortedStreaks = [...longestStreaks].sort((a, b) => a - b);

    const medianFinal = percentile(sortedFinals, 50);
    const p5Final = percentile(sortedFinals, 5);
    const p95Final = percentile(sortedFinals, 95);
    const medianMaxDrawdown = percentile(sortedDD, 50);
    const medianLongestStreak = percentile(sortedStreaks, 50);
    const profitable = finalBalances.filter((b) => b > startBal).length;
    const percentProfitable = (profitable / NUM_SIMS) * 100;

    // Build histogram (20 buckets)
    const minBal = sortedFinals[0];
    const maxBal = sortedFinals[sortedFinals.length - 1];
    const bucketSize = (maxBal - minBal) / 20 || 1;
    const buckets: number[] = new Array(20).fill(0);
    for (const b of finalBalances) {
      const i = Math.min(19, Math.floor((b - minBal) / bucketSize));
      buckets[i]++;
    }
    const histogram = buckets.map((count, i) => {
      const lo = minBal + i * bucketSize;
      const hi = lo + bucketSize;
      const midVal = (lo + hi) / 2;
      return {
        bucket:
          lo >= 1000 ? `$${(lo / 1000).toFixed(0)}k` : `$${Math.round(lo)}`,
        count,
        aboveStart: midVal >= startBal,
      };
    });

    // Build equity curves (p5, median, p95 of curveMatrix per sample point)
    const p5Curve = samplePoints.map((trade, i) => {
      const col = [...curveMatrix[i]].sort((a, b) => a - b);
      return { trade, balance: Math.round(percentile(col, 5)) };
    });
    const medianCurve = samplePoints.map((trade, i) => {
      const col = [...curveMatrix[i]].sort((a, b) => a - b);
      return { trade, balance: Math.round(percentile(col, 50)) };
    });
    const p95Curve = samplePoints.map((trade, i) => {
      const col = [...curveMatrix[i]].sort((a, b) => a - b);
      return { trade, balance: Math.round(percentile(col, 95)) };
    });

    setResults({
      medianFinal,
      p5Final,
      p95Final,
      medianMaxDrawdown,
      medianLongestStreak,
      percentProfitable,
      histogram,
      p5Curve,
      medianCurve,
      p95Curve,
    });

    setProgress(100);
    setRunning(false);
  }, [
    hasEnoughTrades,
    effectiveRisk,
    effectiveTrades,
    effectiveStart,
    winRate,
    avgRR,
  ]);

  const fmtBalance = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(0)}`;
  };

  // Merge curve data for composite line chart
  const mergedCurveData = useMemo(() => {
    if (!results) return [];
    return results.medianCurve.map((pt, i) => ({
      trade: pt.trade,
      median: pt.balance,
      p5: results.p5Curve[i]?.balance ?? pt.balance,
      p95: results.p95Curve[i]?.balance ?? pt.balance,
    }));
  }, [results]);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Dices className="w-5 h-5 text-teal" />
            Monte Carlo Simulation
          </h1>
          <p className="text-sm text-muted-foreground">
            10,000 randomized trade sequences based on your journal statistics
          </p>
        </div>
        {hasEnoughTrades && (
          <Badge
            variant="outline"
            className="border-teal/30 text-teal bg-teal-muted text-[11px]"
          >
            Win Rate: {(winRate * 100).toFixed(1)}% · Avg R:R:{" "}
            {avgRR.toFixed(2)} · Risk: {effectiveRisk.toFixed(2)}%/trade
          </Badge>
        )}
      </div>

      {/* Not enough data gate */}
      {!hasEnoughTrades ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-base font-semibold text-foreground">
              Need at least 10 trades in your journal
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Monte Carlo simulation requires sufficient trade history to
              generate meaningful probabilistic outcomes. You have{" "}
              {trades.length} trade{trades.length !== 1 ? "s" : ""} logged.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Controls */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold text-foreground">
                Simulation Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Number of Trades
                  </Label>
                  <Input
                    type="number"
                    min={50}
                    max={500}
                    value={numTrades}
                    onChange={(e) => setNumTrades(e.target.value)}
                    disabled={running}
                    className="bg-muted border-border text-sm font-mono"
                    data-ocid="monte_carlo.num_trades.input"
                  />
                  <p className="text-[10px] text-muted-foreground">50–500</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Starting Balance ($)
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder={String(derivedStartBalance)}
                    value={startBalance}
                    onChange={(e) => setStartBalance(e.target.value)}
                    disabled={running}
                    className="bg-muted border-border text-sm font-mono"
                    data-ocid="monte_carlo.start_balance.input"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Default: {fmtBalance(derivedStartBalance)} (from journal)
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Risk per Trade (%)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0.1}
                    max={100}
                    placeholder={derivedRiskPct.toFixed(2)}
                    value={riskPct}
                    onChange={(e) => setRiskPct(e.target.value)}
                    disabled={running}
                    className="bg-muted border-border text-sm font-mono"
                    data-ocid="monte_carlo.risk_pct.input"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Default: {derivedRiskPct.toFixed(2)}% (avg from journal)
                  </p>
                </div>
                <div className="flex flex-col justify-end">
                  <Button
                    data-ocid="monte_carlo.run.primary_button"
                    disabled={running}
                    onClick={runSimulation}
                    className="bg-teal hover:bg-teal/90 text-white font-semibold w-full"
                    size="lg"
                  >
                    {running ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running…
                      </>
                    ) : (
                      <>
                        <Dices className="w-4 h-4 mr-2" />
                        Run Simulation
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              {running && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>
                      Running {NUM_SIMS.toLocaleString()} simulations…
                    </span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-2"
                    data-ocid="monte_carlo.loading_state"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                  {
                    label: "Median Final Balance",
                    value: fmtBalance(results.medianFinal),
                    positive: results.medianFinal >= effectiveStart,
                    icon: Activity,
                  },
                  {
                    label: "5th Percentile (Worst)",
                    value: fmtBalance(results.p5Final),
                    positive: results.p5Final >= effectiveStart,
                    negative: results.p5Final < effectiveStart,
                    icon: TrendingDown,
                  },
                  {
                    label: "95th Percentile (Best)",
                    value: fmtBalance(results.p95Final),
                    positive: true,
                    icon: TrendingUp,
                  },
                  {
                    label: "Median Max Drawdown",
                    value: `${results.medianMaxDrawdown.toFixed(1)}%`,
                    negative: results.medianMaxDrawdown > 30,
                    icon: TrendingDown,
                  },
                  {
                    label: "Median Losing Streak",
                    value: `${Math.round(results.medianLongestStreak)} trades`,
                    negative: results.medianLongestStreak > 10,
                    icon: BarChart2,
                  },
                  {
                    label: "% Sims Profitable",
                    value: `${results.percentProfitable.toFixed(1)}%`,
                    positive: results.percentProfitable >= 60,
                    negative: results.percentProfitable < 40,
                    icon: TrendingUp,
                  },
                ].map(({ label, value, positive, negative, icon: Icon }) => (
                  <Card key={label} className="bg-card border-border">
                    <CardContent className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 leading-tight">
                        {label}
                      </p>
                      <p
                        className={cn(
                          "text-lg font-bold font-mono",
                          positive && "text-trade-win",
                          negative && "text-trade-loss",
                          !positive && !negative && "text-foreground",
                        )}
                      >
                        {value}
                      </p>
                      <Icon
                        className={cn(
                          "w-3 h-3 mt-1 opacity-60",
                          positive && "text-trade-win",
                          negative && "text-trade-loss",
                          !positive && !negative && "text-muted-foreground",
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Equity Curves Chart */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Equity Curves (Percentile Distribution)
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-0.5 rounded"
                          style={{ background: CHART_COLORS.win }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          95th %ile
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-0.5 rounded"
                          style={{ background: CHART_COLORS.teal }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Median
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-0.5 rounded"
                          style={{ background: CHART_COLORS.loss }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          5th %ile
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart
                      data={mergedCurveData}
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
                        label={{
                          value: "Trade #",
                          position: "insideBottom",
                          offset: -2,
                          fill: CHART_COLORS.text,
                          fontSize: 10,
                        }}
                      />
                      <YAxis
                        tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) =>
                          v >= 1_000_000
                            ? `$${(v / 1_000_000).toFixed(1)}M`
                            : v >= 1000
                              ? `$${(v / 1000).toFixed(0)}k`
                              : `$${v}`
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
                          fmtBalance(v),
                          name === "p95"
                            ? "95th %ile"
                            : name === "median"
                              ? "Median"
                              : "5th %ile",
                        ]}
                        labelFormatter={(l) => `After ${l} trades`}
                      />
                      <ReferenceLine
                        y={effectiveStart}
                        stroke={CHART_COLORS.text}
                        strokeDasharray="4 4"
                        opacity={0.4}
                      />
                      <Line
                        type="monotone"
                        dataKey="p95"
                        stroke={CHART_COLORS.win}
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="median"
                        stroke={CHART_COLORS.teal}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="p5"
                        stroke={CHART_COLORS.loss}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Histogram */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Final Balance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={results.histogram}
                      margin={{ top: 5, right: 10, left: -20, bottom: 30 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={CHART_COLORS.muted}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="bucket"
                        tick={{ fill: CHART_COLORS.text, fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        angle={-35}
                        textAnchor="end"
                        interval={2}
                      />
                      <YAxis
                        tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          fontSize: "11px",
                        }}
                        formatter={(v: number) => [
                          `${v.toLocaleString()} sims`,
                          "Count",
                        ]}
                      />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                        {results.histogram.map((entry) => (
                          <Cell
                            key={`hist-${entry.bucket}`}
                            fill={
                              entry.aboveStart
                                ? CHART_COLORS.win
                                : CHART_COLORS.loss
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-5 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ background: CHART_COLORS.win }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Above starting balance
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ background: CHART_COLORS.loss }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Below starting balance
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!results && !running && (
            <Card className="bg-card border-border">
              <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                <Dices className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">
                  Ready to simulate
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Configure the parameters above and click "Run Simulation" to
                  generate 10,000 randomized trade sequences.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
