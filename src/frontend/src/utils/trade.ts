import type { Trade } from "../backend.d";

// Grade display mapping
export const GRADE_DISPLAY: Record<string, string> = {
  App: "A++",
  Ap: "A+",
  A: "A",
  B: "B",
  C: "C",
};

export const GRADE_STORAGE: Record<string, string> = {
  "A++": "App",
  "A+": "Ap",
  A: "A",
  B: "B",
  C: "C",
};

export const GRADE_ORDER = ["App", "Ap", "A", "B", "C"];

export function displayGrade(grade: string): string {
  return GRADE_DISPLAY[grade] ?? grade;
}

export function displaySession(session: string): string {
  if (session === "NewYork") return "New York";
  return session;
}

export function sessionFromDisplay(display: string): string {
  if (display === "New York") return "NewYork";
  return display;
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

// R:R calc client-side
export function calcRR(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
): number {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  if (risk === 0) return 0;
  return reward / risk;
}

// R-Multiple from result
export function calcRMultiple(
  result: string,
  rrRatio: number,
  pnlPercent: number,
  riskPercent: number,
): number {
  if (result === "Win") return rrRatio;
  if (result === "Loss") {
    if (riskPercent > 0 && pnlPercent < 0) return pnlPercent / riskPercent;
    return -1;
  }
  return 0;
}

export function getResultColor(result: string): string {
  if (result === "Win") return "text-trade-win";
  if (result === "Loss") return "text-trade-loss";
  return "text-trade-be";
}

export function getResultBg(result: string): string {
  if (result === "Win")
    return "bg-trade-win-muted border-trade-win text-trade-win";
  if (result === "Loss")
    return "bg-trade-loss-muted border-trade-loss text-trade-loss";
  return "bg-trade-be-muted border-trade-be text-trade-be";
}

export function getDirectionColor(direction: string): string {
  return direction === "Long" ? "text-teal" : "text-trade-loss";
}

// Export to CSV
export function exportToCSV(trades: Trade[]): void {
  const headers = [
    "Date",
    "Symbol",
    "Session",
    "Timeframe",
    "Direction",
    "Bias",
    "Setup Type",
    "Entry",
    "Stop Loss",
    "Take Profit",
    "Risk %",
    "RR Ratio",
    "R-Multiple",
    "P&L %",
    "Result",
    "Grade",
    "Tags",
    "Followed Rules",
    "Exited Early",
    "Moved Stop Loss",
    "Psych Before",
    "Psych During",
    "Psych After",
    "Main Lesson",
  ];

  const rows = trades.map((t) => [
    t.date,
    t.symbol,
    displaySession(t.session),
    t.timeframe,
    t.direction,
    t.biasBeforeEntry,
    t.setupType,
    t.entryPrice,
    t.stopLoss,
    t.takeProfit,
    t.riskPercent,
    t.rrRatio.toFixed(2),
    t.rMultiple.toFixed(2),
    t.pnlPercent.toFixed(2),
    t.result,
    displayGrade(t.setupGrade),
    t.tags.join("; "),
    t.followedRules ? "Yes" : "No",
    t.exitedEarly ? "Yes" : "No",
    t.movedStopLoss ? "Yes" : "No",
    t.psychBefore.join("; "),
    t.psychDuring.join("; "),
    t.psychAfter.join("; "),
    t.mainLesson.replace(/"/g, "'"),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sniper-trades-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Compute equity curve from sorted trades
export function computeEquityCurve(
  trades: Trade[],
): { date: string; cumR: number; index: number }[] {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  let cumR = 0;
  return sorted.map((t, i) => {
    cumR += t.rMultiple;
    return {
      date: t.date,
      cumR: Number.parseFloat(cumR.toFixed(2)),
      index: i + 1,
    };
  });
}

// Compute R-Multiple distribution histogram
export function computeRMultipleDistribution(
  trades: Trade[],
): { bucket: string; count: number }[] {
  const buckets: Record<string, number> = {
    "< -2R": 0,
    "-2R to -1R": 0,
    "-1R to 0R": 0,
    "0R to 1R": 0,
    "1R to 2R": 0,
    "2R to 3R": 0,
    "> 3R": 0,
  };

  for (const t of trades) {
    const r = t.rMultiple;
    if (r < -2) buckets["< -2R"]++;
    else if (r < -1) buckets["-2R to -1R"]++;
    else if (r < 0) buckets["-1R to 0R"]++;
    else if (r < 1) buckets["0R to 1R"]++;
    else if (r < 2) buckets["1R to 2R"]++;
    else if (r < 3) buckets["2R to 3R"]++;
    else buckets["> 3R"]++;
  }

  return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));
}

// Compute session breakdown
export interface SessionStats {
  session: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgRR: number;
}

export function computeSessionBreakdown(trades: Trade[]): SessionStats[] {
  const sessions = ["Asian", "London", "NewYork"];
  return sessions.map((session) => {
    const sessionTrades = trades.filter((t) => t.session === session);
    const wins = sessionTrades.filter((t) => t.result === "Win").length;
    const losses = sessionTrades.filter((t) => t.result === "Loss").length;
    const winRate =
      sessionTrades.length > 0 ? (wins / sessionTrades.length) * 100 : 0;
    const avgRR =
      sessionTrades.length > 0
        ? sessionTrades.reduce((sum, t) => sum + t.rrRatio, 0) /
          sessionTrades.length
        : 0;
    return {
      session,
      trades: sessionTrades.length,
      wins,
      losses,
      winRate: Number.parseFloat(winRate.toFixed(1)),
      avgRR: Number.parseFloat(avgRR.toFixed(2)),
    };
  });
}

// Psychology win rate analysis
export interface PsychStats {
  emotion: string;
  trades: number;
  wins: number;
  winRate: number;
}

export function computePsychStats(trades: Trade[]): PsychStats[] {
  const emotionMap: Record<string, { trades: number; wins: number }> = {};

  for (const t of trades) {
    for (const emotion of t.psychBefore) {
      if (!emotionMap[emotion]) emotionMap[emotion] = { trades: 0, wins: 0 };
      emotionMap[emotion].trades++;
      if (t.result === "Win") emotionMap[emotion].wins++;
    }
  }

  return Object.entries(emotionMap)
    .map(([emotion, stats]) => ({
      emotion,
      trades: stats.trades,
      wins: stats.wins,
      winRate: Number.parseFloat(
        ((stats.wins / stats.trades) * 100).toFixed(1),
      ),
    }))
    .sort((a, b) => b.trades - a.trades)
    .slice(0, 8);
}

// Minimal sample shape for display (avoids Principal type conflicts)
interface SampleShape {
  id: string;
  date: string;
  symbol: string;
  session: string;
  timeframe: string;
  direction: string;
  biasBeforeEntry: string;
  setupType: string;
  entryReason: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskPercent: number;
  rrRatio: number;
  rMultiple: number;
  pnlPercent: number;
  result: string;
  psychBefore: string[];
  psychDuring: string[];
  psychAfter: string[];
  followedRules: boolean;
  exitedEarly: boolean;
  movedStopLoss: boolean;
  setupGrade: string;
  tags: string[];
  mainLesson: string;
  createdAt: bigint;
  updatedAt: bigint;
}

const SAMPLE_DATA: SampleShape[] = [
  {
    id: "sample-0",
    date: "2026-02-28",
    symbol: "EURUSD",
    session: "London",
    timeframe: "1H",
    direction: "Long",
    biasBeforeEntry: "Bullish",
    setupType: "OB + FVG Confluence",
    entryReason:
      "Clean bullish OB formed at 1.0820, FVG above providing confluence. London session liquidity sweep below Asian lows confirmed entry.",
    entryPrice: 1.0825,
    stopLoss: 1.08,
    takeProfit: 1.09,
    riskPercent: 1.0,
    rrRatio: 3.0,
    rMultiple: 3.0,
    pnlPercent: 3.0,
    result: "Win",
    psychBefore: ["Calm", "Confident"],
    psychDuring: ["Calm"],
    psychAfter: ["Satisfied", "Proud"],
    followedRules: true,
    exitedEarly: false,
    movedStopLoss: false,
    setupGrade: "Ap",
    tags: ["OB", "FVG", "Liquidity Sweep"],
    mainLesson:
      "Perfect entry on London open. Patience paid off. OB+FVG confluence is my best setup.",
    createdAt: 0n,
    updatedAt: 0n,
  },
  {
    id: "sample-1",
    date: "2026-02-27",
    symbol: "NAS100",
    session: "NewYork",
    timeframe: "15m",
    direction: "Short",
    biasBeforeEntry: "Bearish",
    setupType: "SMT + CHoCH",
    entryReason:
      "SMT divergence between NAS and SPX on 15m. CHoCH confirmed at 17850 after inducement sweep.",
    entryPrice: 17855,
    stopLoss: 17900,
    takeProfit: 17700,
    riskPercent: 0.8,
    rrRatio: 3.44,
    rMultiple: 3.44,
    pnlPercent: 2.75,
    result: "Win",
    psychBefore: ["Calm", "Confident"],
    psychDuring: ["Calm", "Doubtful"],
    psychAfter: ["Satisfied"],
    followedRules: true,
    exitedEarly: false,
    movedStopLoss: false,
    setupGrade: "App",
    tags: ["SMT", "CHoCH", "Inducement"],
    mainLesson:
      "SMT divergence is a high-probability signal. Trust the setup when all criteria align.",
    createdAt: 0n,
    updatedAt: 0n,
  },
  {
    id: "sample-2",
    date: "2026-02-25",
    symbol: "GBPJPY",
    session: "Asian",
    timeframe: "4H",
    direction: "Long",
    biasBeforeEntry: "Bullish",
    setupType: "BOS Retest",
    entryReason:
      "Clean BOS on 4H structure after HTF bullish bias. Retest of broken structure level with bullish candle closure.",
    entryPrice: 192.5,
    stopLoss: 191.8,
    takeProfit: 194.3,
    riskPercent: 1.2,
    rrRatio: 2.57,
    rMultiple: -1,
    pnlPercent: -1.2,
    result: "Loss",
    psychBefore: ["Excited", "FOMO"],
    psychDuring: ["Anxious", "Wanted to move stop loss"],
    psychAfter: ["Frustrated"],
    followedRules: false,
    exitedEarly: false,
    movedStopLoss: true,
    setupGrade: "B",
    tags: ["BOS"],
    mainLesson:
      "Entered with FOMO. Asian session on GJ is low probability. Should have waited for London.",
    createdAt: 0n,
    updatedAt: 0n,
  },
  {
    id: "sample-3",
    date: "2026-02-24",
    symbol: "EURUSD",
    session: "London",
    timeframe: "1H",
    direction: "Short",
    biasBeforeEntry: "Bearish",
    setupType: "Liquidity Sweep + FVG",
    entryReason:
      "Equal highs swept, bearish FVG left behind on 15m. London session distribution confirmed.",
    entryPrice: 1.0865,
    stopLoss: 1.088,
    takeProfit: 1.082,
    riskPercent: 1.0,
    rrRatio: 3.0,
    rMultiple: 3.0,
    pnlPercent: 3.0,
    result: "Win",
    psychBefore: ["Calm", "Confident"],
    psychDuring: ["Calm"],
    psychAfter: ["Satisfied", "Proud"],
    followedRules: true,
    exitedEarly: false,
    movedStopLoss: false,
    setupGrade: "A",
    tags: ["Liquidity Sweep", "FVG"],
    mainLesson:
      "Equal highs sweep followed by FVG mitigation — textbook ICT. Calm mindset = best execution.",
    createdAt: 0n,
    updatedAt: 0n,
  },
  {
    id: "sample-4",
    date: "2026-02-21",
    symbol: "XAUUSD",
    session: "NewYork",
    timeframe: "1H",
    direction: "Long",
    biasBeforeEntry: "Bullish",
    setupType: "OB Mitigation",
    entryReason:
      "HTF bullish bias, 1H OB at key support. New York kill zone entry with tight spread.",
    entryPrice: 2630.0,
    stopLoss: 2622.0,
    takeProfit: 2654.0,
    riskPercent: 1.5,
    rrRatio: 3.0,
    rMultiple: 0,
    pnlPercent: 0,
    result: "BreakEven",
    psychBefore: ["Calm"],
    psychDuring: ["Wanted to exit early", "Anxious"],
    psychAfter: ["Neutral"],
    followedRules: true,
    exitedEarly: true,
    movedStopLoss: true,
    setupGrade: "Ap",
    tags: ["OB"],
    mainLesson:
      "Moved SL to breakeven too early after 1R. Let the trade breathe — structure was still valid.",
    createdAt: 0n,
    updatedAt: 0n,
  },
  {
    id: "sample-5",
    date: "2026-02-19",
    symbol: "NAS100",
    session: "NewYork",
    timeframe: "15m",
    direction: "Long",
    biasBeforeEntry: "Bullish",
    setupType: "FVG Fill + Inducement",
    entryReason:
      "Perfect 15m FVG fill after inducement taken. NY open momentum trade with volume confirmation.",
    entryPrice: 17620,
    stopLoss: 17590,
    takeProfit: 17720,
    riskPercent: 1.0,
    rrRatio: 3.33,
    rMultiple: 3.33,
    pnlPercent: 3.33,
    result: "Win",
    psychBefore: ["Calm", "Confident"],
    psychDuring: ["Calm"],
    psychAfter: ["Proud", "Satisfied"],
    followedRules: true,
    exitedEarly: false,
    movedStopLoss: false,
    setupGrade: "App",
    tags: ["FVG", "Inducement"],
    mainLesson:
      "NY open FVG trades remain my highest probability setup. Confidence from calm state.",
    createdAt: 0n,
    updatedAt: 0n,
  },
];

export const SAMPLE_TRADES = SAMPLE_DATA as unknown as Trade[];
