import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Calculator,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

// ──────────────────────────────────────────────
// Base pip value table (pip value when position size = $100)
// ──────────────────────────────────────────────
const BASE_PIP_VALUES: Record<string, number> = {
  USDJPY: 0.7,
  GBPUSD: 0.7,
  EURUSD: 0.9,
  XAUUSD: 0.001,
  BTCUSD: 0.1,
  ETHUSD: 0.5,
};

const INSTRUMENTS = [
  { value: "EURUSD", label: "EURUSD — Euro / US Dollar" },
  { value: "GBPUSD", label: "GBPUSD — British Pound / US Dollar" },
  { value: "USDJPY", label: "USDJPY — US Dollar / Japanese Yen" },
  { value: "XAUUSD", label: "XAUUSD — Gold / US Dollar" },
  { value: "BTCUSD", label: "BTCUSD — Bitcoin / US Dollar" },
  { value: "ETHUSD", label: "ETHUSD — Ethereum / US Dollar" },
];

// ──────────────────────────────────────────────
// Calculation logic
// ──────────────────────────────────────────────
interface CalcInputs {
  instrument: string;
  positionSize: number; // dollar amount used in trade
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}

interface CalcResults {
  basePipValue: number;
  pipValue: number; // scaled by position size
  stopLossPips: number;
  takeProfitPips: number;
  potentialLoss: number;
  potentialProfit: number;
  rewardToRisk: number;
  valid: boolean;
  tpValid: boolean;
}

function calculate(inputs: CalcInputs): CalcResults {
  const {
    instrument,
    positionSize,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
  } = inputs;

  const empty: CalcResults = {
    basePipValue: BASE_PIP_VALUES[instrument] ?? 0,
    pipValue: 0,
    stopLossPips: 0,
    takeProfitPips: 0,
    potentialLoss: 0,
    potentialProfit: 0,
    rewardToRisk: 0,
    valid: false,
    tpValid: false,
  };

  if (
    !positionSize ||
    positionSize <= 0 ||
    !entryPrice ||
    entryPrice <= 0 ||
    !stopLossPrice ||
    stopLossPrice <= 0 ||
    entryPrice === stopLossPrice
  ) {
    return empty;
  }

  const basePipValue = BASE_PIP_VALUES[instrument] ?? 0;

  // Dynamic pip value scaled by position size
  // Formula: Pip Value = Base Pip Value × (Position Size ÷ 100)
  const pipValue = basePipValue * (positionSize / 100);

  // Stop loss distance: |Entry - SL|
  const stopLossPips = Math.abs(entryPrice - stopLossPrice);

  // Take profit distance: |TP - Entry|
  const tpValid = takeProfitPrice > 0 && takeProfitPrice !== entryPrice;
  const takeProfitPips = tpValid ? Math.abs(takeProfitPrice - entryPrice) : 0;

  // P&L calculations
  const potentialLoss = pipValue * stopLossPips;
  const potentialProfit = tpValid ? pipValue * takeProfitPips : 0;

  // RR = TP Pips ÷ SL Pips
  const rewardToRisk =
    tpValid && stopLossPips > 0 ? takeProfitPips / stopLossPips : 0;

  return {
    basePipValue,
    pipValue,
    stopLossPips,
    takeProfitPips,
    potentialLoss,
    potentialProfit,
    rewardToRisk,
    valid: true,
    tpValid,
  };
}

// ──────────────────────────────────────────────
// Formatting helpers
// ──────────────────────────────────────────────
function fmtMoney(n: number, decimals = 4): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: decimals })}`;
}

function fmtPips(n: number): string {
  // Show enough decimals for small values (e.g. EURUSD = 0.0050)
  if (n < 0.01) return n.toFixed(6);
  if (n < 1) return n.toFixed(4);
  return n.toFixed(2);
}

function fmtPipValue(n: number): string {
  if (n < 0.001) return `$${n.toFixed(6)} per pip`;
  if (n < 0.01) return `$${n.toFixed(5)} per pip`;
  return `$${n.toFixed(4)} per pip`;
}

// ──────────────────────────────────────────────
// Result card component
// ──────────────────────────────────────────────
interface ResultCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  positive?: boolean;
  negative?: boolean;
  accent?: boolean;
  neutral?: boolean;
}

function ResultCard({
  label,
  value,
  sub,
  highlight,
  positive,
  negative,
  accent,
  neutral,
}: ResultCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 border transition-all",
        highlight
          ? "bg-teal/5 border-teal/20"
          : positive
            ? "bg-emerald-500/5 border-emerald-500/20"
            : negative
              ? "bg-red-500/5 border-red-500/20"
              : accent
                ? "bg-violet-500/5 border-violet-500/20"
                : neutral
                  ? "bg-blue-500/5 border-blue-500/20"
                  : "bg-card border-border",
      )}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-mono font-bold tabular-nums",
          highlight
            ? "text-teal"
            : positive
              ? "text-emerald-400"
              : negative
                ? "text-red-400"
                : accent
                  ? "text-violet-400"
                  : neutral
                    ? "text-blue-400"
                    : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="sm:col-span-2 flex items-center gap-2 pt-2 first:pt-0">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
        {children}
      </span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm text-foreground font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main page component
// ──────────────────────────────────────────────
export default function RiskCalculatorPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [instrument, setInstrument] = useState("EURUSD");
  const [positionSize, setPositionSize] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [takeProfitPrice, setTakeProfitPrice] = useState("");

  const results = useMemo(() => {
    return calculate({
      instrument,
      positionSize: Number.parseFloat(positionSize) || 0,
      entryPrice: Number.parseFloat(entryPrice) || 0,
      stopLossPrice: Number.parseFloat(stopLossPrice) || 0,
      takeProfitPrice: Number.parseFloat(takeProfitPrice) || 0,
    });
  }, [instrument, positionSize, entryPrice, stopLossPrice, takeProfitPrice]);

  const rrLabel =
    results.tpValid && results.rewardToRisk > 0
      ? `1 : ${results.rewardToRisk.toFixed(2)}`
      : "—";

  const selectStyle = {
    backgroundColor: isDark ? "#1a1f2e" : "#ffffff",
    color: isDark ? "#e2e8f0" : "#0f172a",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center",
    paddingRight: "36px",
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
            <Calculator className="w-4.5 h-4.5 text-teal" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Risk Calculator
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Pip values scale dynamically based on your position size
        </p>
      </div>

      {/* Base pip value reference strip */}
      <div className="mb-5 rounded-xl bg-card border border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
          Base Pip Values (per $100 position)
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(BASE_PIP_VALUES).map(([sym, val]) => (
            <span
              key={sym}
              className={cn(
                "text-xs font-mono px-2.5 py-1 rounded-md border transition-colors",
                instrument === sym
                  ? "bg-teal/10 border-teal/30 text-teal font-bold"
                  : "bg-muted/30 border-border text-muted-foreground",
              )}
            >
              {sym} = ${val}
            </span>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── LEFT: Inputs ── */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal" />
              Trade Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Instrument Selector */}
            <Field label="Trading Instrument" id="instrument">
              <select
                id="instrument"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                data-ocid="risk_calc.instrument.select"
                className="w-full h-10 rounded-md border border-border px-3 py-2 text-sm font-mono appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                style={selectStyle}
              >
                {INSTRUMENTS.map((ins) => (
                  <option
                    key={ins.value}
                    value={ins.value}
                    style={{
                      backgroundColor: isDark ? "#1a1f2e" : "#ffffff",
                      color: isDark ? "#e2e8f0" : "#0f172a",
                    }}
                  >
                    {ins.label}
                  </option>
                ))}
              </select>
            </Field>

            {/* Position Size */}
            <Field label="Position Size ($)" id="position-size">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                  $
                </span>
                <Input
                  id="position-size"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="100"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  className="pl-7 bg-input border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
                  data-ocid="risk_calc.position_size.input"
                />
              </div>
              {/* Live pip value preview */}
              {Number.parseFloat(positionSize) > 0 && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Pip Value ={" "}
                  <span className="text-teal font-semibold">
                    $
                    {(
                      BASE_PIP_VALUES[instrument] *
                      (Number.parseFloat(positionSize) / 100)
                    ).toFixed(6)}
                  </span>{" "}
                  &nbsp;({BASE_PIP_VALUES[instrument]} × {positionSize} ÷ 100)
                </p>
              )}
            </Field>

            {/* Entry Price */}
            <Field label="Entry Price" id="entry-price">
              <Input
                id="entry-price"
                type="number"
                min="0"
                step="any"
                placeholder="1.10500"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
                data-ocid="risk_calc.entry.input"
              />
            </Field>

            {/* Stop Loss */}
            <Field label="Stop Loss" id="stop-loss">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400/60" />
                </span>
                <Input
                  id="stop-loss"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="1.10000"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  className="pl-8 bg-input border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
                  data-ocid="risk_calc.stoploss.input"
                />
              </div>
            </Field>

            {/* Take Profit */}
            <Field label="Take Profit" id="take-profit">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400/60" />
                </span>
                <Input
                  id="take-profit"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="1.11000"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  className="pl-8 bg-input border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
                  data-ocid="risk_calc.takeprofit.input"
                />
              </div>
            </Field>

            {/* Live distance preview */}
            {results.valid && (
              <div className="space-y-2">
                <div className="rounded-lg bg-red-500/5 border border-red-500/15 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    SL Distance
                  </span>
                  <span className="text-sm font-mono font-semibold text-red-400">
                    {fmtPips(results.stopLossPips)}
                  </span>
                </div>
                {results.tpValid && (
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      TP Distance
                    </span>
                    <span className="text-sm font-mono font-semibold text-emerald-400">
                      {fmtPips(results.takeProfitPips)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── RIGHT: Results ── */}
        <Card
          className="bg-card border-border"
          data-ocid="risk_calc.result.panel"
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal" />
              Calculated Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!results.valid ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  Select an instrument and enter position size, entry, and stop
                  loss to see your calculations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pip Value */}
                <SectionLabel>Pip Value</SectionLabel>
                <ResultCard
                  label="Base Pip Value (per $100)"
                  value={`$${results.basePipValue}`}
                  sub={`${instrument} base rate`}
                />
                <ResultCard
                  label="Scaled Pip Value"
                  value={fmtPipValue(results.pipValue)}
                  sub={`${results.basePipValue} × (${positionSize} ÷ 100)`}
                  highlight
                />

                {/* Stop Loss */}
                <SectionLabel>Stop Loss</SectionLabel>
                <ResultCard
                  label="SL Distance"
                  value={fmtPips(results.stopLossPips)}
                />
                <ResultCard
                  label="Potential Loss"
                  value={`-${fmtMoney(results.potentialLoss)}`}
                  sub={`${fmtPipValue(results.pipValue)} × ${fmtPips(results.stopLossPips)}`}
                  negative
                />

                {/* Take Profit */}
                {results.tpValid && (
                  <>
                    <SectionLabel>Take Profit</SectionLabel>
                    <ResultCard
                      label="TP Distance"
                      value={fmtPips(results.takeProfitPips)}
                    />
                    <ResultCard
                      label="Potential Profit"
                      value={`+${fmtMoney(results.potentialProfit)}`}
                      sub={`${fmtPipValue(results.pipValue)} × ${fmtPips(results.takeProfitPips)}`}
                      positive
                    />

                    {/* Risk:Reward */}
                    <SectionLabel>Reward to Risk</SectionLabel>
                    <div className="sm:col-span-2">
                      <ResultCard
                        label="R:R Ratio"
                        value={rrLabel}
                        sub={"TP Distance 00f7 SL Distance"}
                        accent
                      />
                    </div>

                    {/* Summary row */}
                    <SectionLabel>Summary</SectionLabel>
                    <div className="sm:col-span-2 rounded-xl border border-border bg-muted/20 px-4 py-3 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Loss
                        </p>
                        <p className="text-lg font-mono font-bold text-red-400">
                          -{fmtMoney(results.potentialLoss, 2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">RR</p>
                        <p className="text-lg font-mono font-bold text-violet-400">
                          {rrLabel}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Profit
                        </p>
                        <p className="text-lg font-mono font-bold text-emerald-400">
                          +{fmtMoney(results.potentialProfit, 2)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* High risk warning */}
                {results.potentialLoss >
                  Number.parseFloat(positionSize) * 0.05 && (
                  <div
                    data-ocid="risk_calc.risk_warning.toast"
                    className="sm:col-span-2 flex items-start gap-3 rounded-xl px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium"
                    role="alert"
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Potential loss exceeds 5% of position size. Consider
                      tightening your stop loss.
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formula reference footer */}
      <div className="mt-5 rounded-xl bg-card border border-border px-4 py-3 space-y-1.5">
        <p className="text-xs font-semibold text-foreground mb-1">
          Calculation Formulas
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          <span className="text-teal">Pip Value</span> = Base Pip Value ×
          (Position Size ÷ 100)
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          <span className="text-red-400">Loss</span> = Pip Value × |Entry − Stop
          Loss|
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          <span className="text-emerald-400">Profit</span> = Pip Value × |Take
          Profit − Entry|
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          <span className="text-violet-400">RR</span> = TP Distance ÷ SL
          Distance
        </p>
      </div>
    </div>
  );
}
