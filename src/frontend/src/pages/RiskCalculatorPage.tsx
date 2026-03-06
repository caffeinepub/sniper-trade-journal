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
// Trading pair groups
// ──────────────────────────────────────────────
const PAIR_GROUPS = [
  {
    label: "Forex",
    pairs: [
      "EURUSD",
      "GBPUSD",
      "USDJPY",
      "AUDUSD",
      "USDCAD",
      "USDCHF",
      "NZDUSD",
      "EURJPY",
      "GBPJPY",
      "EURGBP",
      "AUDJPY",
      "CADJPY",
      "EURAUD",
      "GBPAUD",
      "AUDNZD",
      "EURNZD",
      "GBPNZD",
      "CHFJPY",
      "EURCAD",
      "GBPCAD",
      "AUDCAD",
      "NZDCAD",
      "NZDJPY",
      "AUDCHF",
      "GBPCHF",
      "EURCHF",
      "CADCHF",
      "NZDCHF",
    ],
  },
  {
    label: "Metals",
    pairs: ["XAUUSD"],
  },
  {
    label: "Crypto",
    pairs: [
      "BTCUSD",
      "ETHUSD",
      "SOLUSD",
      "BNBUSD",
      "XRPUSD",
      "ADAUSD",
      "DOTUSD",
      "MATICUSD",
    ],
  },
] as const;

// ──────────────────────────────────────────────
// Asset type detection
// ──────────────────────────────────────────────
type AssetType = "forex" | "jpy-forex" | "gold" | "crypto";

const CRYPTO_PREFIXES = [
  "BTC",
  "ETH",
  "SOL",
  "BNB",
  "XRP",
  "ADA",
  "DOT",
  "MATIC",
];

function detectAssetType(pair: string): AssetType {
  if (pair === "XAUUSD") return "gold";
  if (CRYPTO_PREFIXES.some((p) => pair.startsWith(p))) return "crypto";
  if (pair.includes("JPY")) return "jpy-forex";
  return "forex";
}

// ──────────────────────────────────────────────
// Calculation logic
// ──────────────────────────────────────────────
interface CalcInputs {
  accountBalance: number;
  riskPercent: number;
  pair: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}

interface CalcResults {
  riskAmount: number;
  stopLossDistancePips: number;
  takeProfitDistancePips: number;
  pipValue: number;
  lotSize: number;
  positionSizeUnits: number;
  potentialProfit: number;
  riskRewardRatio: number;
  assetType: AssetType;
  valid: boolean;
  tpValid: boolean;
}

function calculate(inputs: CalcInputs): CalcResults {
  const {
    accountBalance,
    riskPercent,
    pair,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
  } = inputs;
  const assetType = detectAssetType(pair);

  // Validate core required inputs
  if (
    !accountBalance ||
    !riskPercent ||
    !entryPrice ||
    !stopLossPrice ||
    accountBalance <= 0 ||
    riskPercent <= 0 ||
    entryPrice <= 0 ||
    stopLossPrice <= 0 ||
    entryPrice === stopLossPrice
  ) {
    return {
      riskAmount: 0,
      stopLossDistancePips: 0,
      takeProfitDistancePips: 0,
      pipValue: 0,
      lotSize: 0,
      positionSizeUnits: 0,
      potentialProfit: 0,
      riskRewardRatio: 0,
      assetType,
      valid: false,
      tpValid: false,
    };
  }

  // Pip size based on asset type
  const pipSize =
    assetType === "gold"
      ? 0.01
      : assetType === "jpy-forex"
        ? 0.01
        : assetType === "crypto"
          ? 1
          : 0.0001;

  // Stop loss distance in pips
  const stopLossDistancePips = Math.abs(entryPrice - stopLossPrice) / pipSize;

  // Risk amount
  const riskAmount = accountBalance * (riskPercent / 100);

  // Pip value per standard lot
  const pipValue =
    assetType === "gold" ? 1 : assetType === "crypto" ? entryPrice : 10;

  // TP calculations
  const tpValid = takeProfitPrice > 0 && takeProfitPrice !== entryPrice;

  const takeProfitDistancePips = tpValid
    ? Math.abs(entryPrice - takeProfitPrice) / pipSize
    : 0;

  if (assetType === "crypto") {
    const positionSizeUnits = riskAmount / Math.abs(entryPrice - stopLossPrice);

    const potentialProfit = tpValid
      ? positionSizeUnits * Math.abs(entryPrice - takeProfitPrice)
      : 0;

    const riskRewardRatio =
      tpValid && stopLossDistancePips > 0
        ? takeProfitDistancePips / stopLossDistancePips
        : 0;

    return {
      riskAmount,
      stopLossDistancePips,
      takeProfitDistancePips,
      pipValue: 0,
      lotSize: 0,
      positionSizeUnits,
      potentialProfit,
      riskRewardRatio,
      assetType,
      valid: true,
      tpValid,
    };
  }

  // Forex / Gold lot size
  const lotSize = riskAmount / (stopLossDistancePips * pipValue);

  // Position size in units
  const positionSizeUnits =
    assetType === "gold" ? lotSize * 100 : lotSize * 100000;

  // TP profit: tpPips × pipValue × lotSize
  const potentialProfit = tpValid
    ? takeProfitDistancePips * pipValue * lotSize
    : 0;

  const riskRewardRatio =
    tpValid && stopLossDistancePips > 0
      ? takeProfitDistancePips / stopLossDistancePips
      : 0;

  return {
    riskAmount,
    stopLossDistancePips,
    takeProfitDistancePips,
    pipValue,
    lotSize,
    positionSizeUnits,
    potentialProfit,
    riskRewardRatio,
    assetType,
    valid: true,
    tpValid,
  };
}

// ──────────────────────────────────────────────
// Formatting helpers
// ──────────────────────────────────────────────
function fmtMoney(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPips(n: number): string {
  return `${n.toFixed(1)} pips`;
}

function fmtPipValue(n: number): string {
  return `$${n.toFixed(2)} per lot`;
}

function fmtLots(n: number): string {
  return `${n.toFixed(2)} lots`;
}

function fmtUnits(n: number, assetType: AssetType, pair: string): string {
  if (assetType === "crypto") {
    const base = pair.replace("USD", "");
    return `${n.toFixed(4)} ${base}`;
  }
  return `${Math.round(n).toLocaleString("en-US")} units`;
}

// ──────────────────────────────────────────────
// Result card component
// ──────────────────────────────────────────────
interface ResultCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
  positive?: boolean;
  negative?: boolean;
  accent?: boolean;
}

function ResultCard({
  label,
  value,
  highlight,
  warning,
  positive,
  negative,
  accent,
}: ResultCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 border transition-all",
        highlight
          ? "bg-teal/5 border-teal/20"
          : warning
            ? "bg-amber-500/5 border-amber-500/20"
            : positive
              ? "bg-emerald-500/5 border-emerald-500/20"
              : negative
                ? "bg-red-500/5 border-red-500/20"
                : accent
                  ? "bg-violet-500/5 border-violet-500/20"
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
            : warning
              ? "text-amber-400"
              : positive
                ? "text-emerald-400"
                : negative
                  ? "text-red-400"
                  : accent
                    ? "text-violet-400"
                    : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Section divider inside results
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Styled input field wrapper
// ──────────────────────────────────────────────
interface FieldProps {
  label: string;
  id: string;
  children: React.ReactNode;
}

function Field({ label, id, children }: FieldProps) {
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

  const [accountBalance, setAccountBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [pair, setPair] = useState("EURUSD");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [takeProfitPrice, setTakeProfitPrice] = useState("");

  const results = useMemo(() => {
    return calculate({
      accountBalance: Number.parseFloat(accountBalance) || 0,
      riskPercent: Number.parseFloat(riskPercent) || 0,
      pair,
      entryPrice: Number.parseFloat(entryPrice) || 0,
      stopLossPrice: Number.parseFloat(stopLossPrice) || 0,
      takeProfitPrice: Number.parseFloat(takeProfitPrice) || 0,
    });
  }, [
    accountBalance,
    riskPercent,
    pair,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
  ]);

  const riskPctNum = Number.parseFloat(riskPercent) || 0;
  const showWarning = riskPctNum > 3 && !Number.isNaN(riskPctNum);

  // Format RR ratio as "1 : X.X"
  const rrLabel =
    results.tpValid && results.riskRewardRatio > 0
      ? `1 : ${results.riskRewardRatio.toFixed(1)}`
      : "—";

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
          Calculate your position size and profit potential based on risk
          management rules
        </p>
      </div>

      {/* Risk warning banner */}
      {showWarning && (
        <div
          data-ocid="risk_calc.risk_warning.toast"
          className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            ⚠ Warning: You are risking more than 3% of your account. Consider
            reducing your risk to protect your capital.
          </span>
        </div>
      )}

      {/* Two-column layout: inputs | results */}
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
            {/* Account Balance */}
            <Field label="Account Balance" id="account-balance">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                  $
                </span>
                <Input
                  id="account-balance"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="5000"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  className="pl-7 bg-input border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
                  data-ocid="risk_calc.balance.input"
                />
              </div>
            </Field>

            {/* Risk Percentage */}
            <Field label="Risk Percentage" id="risk-percent">
              <div className="relative">
                <Input
                  id="risk-percent"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  placeholder="1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  className="pr-9 bg-input border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
                  data-ocid="risk_calc.risk_pct.input"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                  %
                </span>
              </div>
            </Field>

            {/* Trading Pair */}
            <Field label="Trading Pair" id="trading-pair">
              <select
                id="trading-pair"
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                data-ocid="risk_calc.pair.select"
                className={cn(
                  "w-full h-10 rounded-md border border-border px-3 py-2",
                  "text-sm font-mono appearance-none cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                  "transition-colors",
                )}
                style={{
                  backgroundColor: isDark ? "#1a1f2e" : "#ffffff",
                  color: isDark ? "#e2e8f0" : "#0f172a",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: "36px",
                }}
              >
                {PAIR_GROUPS.map((group) => (
                  <optgroup
                    key={group.label}
                    label={group.label}
                    style={{
                      backgroundColor: isDark ? "#1a1f2e" : "#ffffff",
                      color: isDark ? "#e2e8f0" : "#0f172a",
                    }}
                  >
                    {group.pairs.map((p) => (
                      <option
                        key={p}
                        value={p}
                        style={{
                          backgroundColor: isDark ? "#1a1f2e" : "#ffffff",
                          color: isDark ? "#e2e8f0" : "#0f172a",
                        }}
                      >
                        {p}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>

            {/* Entry Price */}
            <Field label="Entry Price" id="entry-price">
              <Input
                id="entry-price"
                type="number"
                min="0"
                step="any"
                placeholder="1.1050"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
                data-ocid="risk_calc.entry.input"
              />
            </Field>

            {/* Stop Loss Price */}
            <Field label="Stop Loss Price" id="stop-loss">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400/60" />
                </span>
                <Input
                  id="stop-loss"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="1.1000"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  className="pl-8 bg-input border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
                  data-ocid="risk_calc.stoploss.input"
                />
              </div>
            </Field>

            {/* Take Profit Price */}
            <Field label="Take Profit Price (TP)" id="take-profit">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400/60" />
                </span>
                <Input
                  id="take-profit"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="1.1100"
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
                    {results.stopLossDistancePips.toFixed(1)} pips
                  </span>
                </div>
                {results.tpValid && (
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      TP Distance
                    </span>
                    <span className="text-sm font-mono font-semibold text-emerald-400">
                      {results.takeProfitDistancePips.toFixed(1)} pips
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
                <p className="text-sm text-muted-foreground max-w-[220px]">
                  Enter account balance, risk %, entry and stop loss to see your
                  position size.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ── Risk Section ── */}
                <SectionLabel>Risk</SectionLabel>

                <ResultCard
                  label="Risk Amount"
                  value={fmtMoney(results.riskAmount)}
                  highlight
                />
                <ResultCard
                  label="Loss if SL Hits"
                  value={`-${fmtMoney(results.riskAmount)}`}
                  negative
                />

                {/* ── Stop Loss Section ── */}
                <SectionLabel>Stop Loss</SectionLabel>

                <ResultCard
                  label="Stop Loss Distance"
                  value={fmtPips(results.stopLossDistancePips)}
                />
                <ResultCard
                  label="Pip Value"
                  value={
                    results.assetType === "crypto"
                      ? "—"
                      : fmtPipValue(results.pipValue)
                  }
                />

                {/* ── Position Section ── */}
                <SectionLabel>Position</SectionLabel>

                <ResultCard
                  label="Lot Size"
                  value={
                    results.assetType === "crypto"
                      ? "—"
                      : fmtLots(results.lotSize)
                  }
                />
                <ResultCard
                  label="Position Size"
                  value={fmtUnits(
                    results.positionSizeUnits,
                    results.assetType,
                    pair,
                  )}
                  highlight
                />

                {/* ── Take Profit Section (only when TP is entered) ── */}
                {results.tpValid && (
                  <>
                    <SectionLabel>Take Profit</SectionLabel>

                    <ResultCard
                      label="TP Distance"
                      value={fmtPips(results.takeProfitDistancePips)}
                    />
                    <ResultCard
                      label="Potential Profit if TP Hits"
                      value={`+${fmtMoney(results.potentialProfit)}`}
                      positive
                    />

                    {/* ── Risk-to-Reward ── */}
                    <SectionLabel>Risk to Reward</SectionLabel>

                    <div className="sm:col-span-2">
                      <ResultCard
                        label="Risk : Reward"
                        value={rrLabel}
                        accent
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info footer */}
      <div className="mt-5 rounded-xl bg-card border border-border px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">How it works:</span>{" "}
          <span className="font-mono text-teal">Lot Size</span> = Risk Amount ÷
          (SL Pips × Pip Value).{" "}
          <span className="font-mono text-emerald-400">Profit</span> = TP Pips ×
          Pip Value × Lot Size.{" "}
          <span className="font-mono text-violet-400">RR</span> = TP Distance ÷
          SL Distance. Pip value: Forex = $10/lot, Gold = $1/lot. Always verify
          with your broker.
        </p>
      </div>
    </div>
  );
}
