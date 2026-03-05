import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetTrades } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { displayGrade, displaySession, getResultBg } from "@/utils/trade";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Trade } from "../backend.d";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface DayStats {
  total: number;
  wins: number;
  losses: number;
  bes: number;
  netR: number;
  winRate: number;
  bestR: number;
  worstR: number;
}

function computeDayStats(dayTrades: Trade[]): DayStats {
  const total = dayTrades.length;
  const wins = dayTrades.filter((t) => t.result === "Win").length;
  const losses = dayTrades.filter((t) => t.result === "Loss").length;
  const bes = dayTrades.filter((t) => t.result === "BreakEven").length;
  const netR = dayTrades.reduce((s, t) => s + t.rMultiple, 0);
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const rValues = dayTrades.map((t) => t.rMultiple);
  const bestR = rValues.length > 0 ? Math.max(...rValues) : 0;
  const worstR = rValues.length > 0 ? Math.min(...rValues) : 0;
  return { total, wins, losses, bes, netR, winRate, bestR, worstR };
}

function CalendarCell({
  day,
  today,
  tradesByDate,
  onSelect,
}: {
  day: Date | null;
  idx?: number;
  today: Date;
  tradesByDate: Record<string, Trade[]>;
  onSelect: (key: string) => void;
}) {
  if (!day) {
    return <div className="min-h-[52px]" />;
  }

  const key = toDateKey(day);
  const todayKey = toDateKey(today);
  const dayTrades = tradesByDate[key] ?? [];
  const isToday = key === todayKey;
  const hasTrades = dayTrades.length > 0;
  const isPast = day <= today;

  const stats = hasTrades ? computeDayStats(dayTrades) : null;

  return (
    <button
      type="button"
      key={key}
      onClick={() => {
        if (hasTrades) onSelect(key);
      }}
      className={cn(
        "min-h-[52px] rounded-md p-1 text-xs transition-all flex flex-col items-center justify-start w-full",
        isToday && "ring-1 ring-teal",
        hasTrades ? "cursor-pointer hover:bg-muted/80" : "cursor-default",
        !isPast && "opacity-40",
        "bg-muted/30",
      )}
    >
      <span
        className={cn(
          "text-xs leading-none mb-1",
          isToday ? "text-teal font-bold" : "text-muted-foreground",
        )}
      >
        {day.getDate()}
      </span>
      {stats && (
        <>
          {/* Colored dots row */}
          <div className="flex gap-0.5 flex-wrap justify-center mb-0.5">
            {Array.from({ length: Math.min(stats.wins, 3) }).map((_, i) => (
              <div
                key={`w${String(i)}`}
                className="w-1.5 h-1.5 rounded-full bg-trade-win"
              />
            ))}
            {Array.from({ length: Math.min(stats.losses, 3) }).map((_, i) => (
              <div
                key={`l${String(i)}`}
                className="w-1.5 h-1.5 rounded-full bg-trade-loss"
              />
            ))}
            {stats.bes > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-trade-be" />
            )}
          </div>
          {/* Trade count */}
          <span className="text-[8px] font-mono text-muted-foreground leading-none mb-0.5">
            {stats.total}T
          </span>
          {/* Net R */}
          <span
            className={cn(
              "text-[8px] font-mono leading-none font-semibold",
              stats.netR >= 0 ? "text-trade-win" : "text-trade-loss",
            )}
          >
            {stats.netR >= 0 ? "+" : ""}
            {stats.netR.toFixed(1)}R
          </span>
        </>
      )}
    </button>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: tradesData } = useGetTrades();
  const trades: Trade[] = useMemo(() => {
    return tradesData ?? [];
  }, [tradesData]);

  const tradesByDate = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    for (const t of trades) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return map;
  }, [trades]);

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month],
  );

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const selectedTrades = selectedDay ? (tradesByDate[selectedDay] ?? []) : [];

  const monthlyTrades = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return trades.filter((t) => t.date.startsWith(prefix));
  }, [trades, year, month]);

  const monthlyWins = monthlyTrades.filter((t) => t.result === "Win").length;
  const monthlyNetR = monthlyTrades.reduce((s, t) => s + t.rMultiple, 0);
  const monthlyWinRate =
    monthlyTrades.length > 0 ? (monthlyWins / monthlyTrades.length) * 100 : 0;

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Trade Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Click any day to see trades
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">Trades</p>
            <p className="font-bold font-mono">{monthlyTrades.length}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Win Rate</p>
            <p
              className={cn(
                "font-bold font-mono",
                monthlyWinRate >= 50 ? "text-trade-win" : "text-trade-loss",
              )}
            >
              {monthlyWinRate.toFixed(0)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Net R</p>
            <p
              className={cn(
                "font-bold font-mono",
                monthlyNetR >= 0 ? "text-trade-win" : "text-trade-loss",
              )}
            >
              {monthlyNetR >= 0 ? "+" : ""}
              {monthlyNetR.toFixed(2)}R
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          data-ocid="calendar.prev.button"
          variant="outline"
          size="sm"
          className="border-border h-8 w-8 p-0"
          onClick={prevMonth}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-base font-semibold">
          {MONTHS[month]} {year}
        </h2>
        <Button
          data-ocid="calendar.next.button"
          variant="outline"
          size="sm"
          className="border-border h-8 w-8 p-0"
          onClick={nextMonth}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <Card className="bg-card border-border">
        <CardContent className="p-2 sm:p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => (
              <CalendarCell
                key={
                  day ? toDateKey(day) : `pad-${String(idx).padStart(2, "0")}`
                }
                day={day}
                idx={idx}
                today={today}
                tradesByDate={tradesByDate}
                onSelect={setSelectedDay}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-trade-win" />
              <span className="text-[10px] text-muted-foreground">Win</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-trade-loss" />
              <span className="text-[10px] text-muted-foreground">Loss</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-trade-be" />
              <span className="text-[10px] text-muted-foreground">
                Break Even
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day detail dialog */}
      <Dialog
        open={!!selectedDay}
        onOpenChange={(v) => {
          if (!v) setSelectedDay(null);
        }}
      >
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>
              Trades on{" "}
              {selectedDay
                ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    },
                  )
                : ""}
            </DialogTitle>
          </DialogHeader>

          {/* Daily summary strip */}
          {selectedTrades.length > 0 &&
            (() => {
              const ds = computeDayStats(selectedTrades);
              return (
                <div className="grid grid-cols-3 gap-2 mb-1">
                  <div className="bg-muted/50 rounded-md p-2 text-center">
                    <p className="text-[10px] text-muted-foreground leading-none mb-1">
                      Trades
                    </p>
                    <p className="text-sm font-bold font-mono">{ds.total}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2 text-center">
                    <p className="text-[10px] text-muted-foreground leading-none mb-1">
                      W / L / B
                    </p>
                    <p className="text-sm font-bold font-mono">
                      <span className="text-trade-win">{ds.wins}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-trade-loss">{ds.losses}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-trade-be">{ds.bes}</span>
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2 text-center">
                    <p className="text-[10px] text-muted-foreground leading-none mb-1">
                      Win Rate
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold font-mono",
                        ds.winRate >= 50 ? "text-trade-win" : "text-trade-loss",
                      )}
                    >
                      {ds.winRate.toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2 text-center">
                    <p className="text-[10px] text-muted-foreground leading-none mb-1">
                      Net R
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold font-mono",
                        ds.netR >= 0 ? "text-trade-win" : "text-trade-loss",
                      )}
                    >
                      {ds.netR >= 0 ? "+" : ""}
                      {ds.netR.toFixed(2)}R
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2 text-center">
                    <p className="text-[10px] text-muted-foreground leading-none mb-1">
                      Best
                    </p>
                    <p className="text-sm font-bold font-mono text-trade-win">
                      +{ds.bestR.toFixed(2)}R
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2 text-center">
                    <p className="text-[10px] text-muted-foreground leading-none mb-1">
                      Worst
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold font-mono",
                        ds.worstR >= 0 ? "text-trade-win" : "text-trade-loss",
                      )}
                    >
                      {ds.worstR >= 0 ? "+" : ""}
                      {ds.worstR.toFixed(2)}R
                    </p>
                  </div>
                </div>
              );
            })()}

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {selectedTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center gap-3 p-3 rounded-md bg-muted border border-border"
              >
                <div
                  className={cn(
                    "w-1 self-stretch rounded-full",
                    trade.result === "Win"
                      ? "bg-trade-win"
                      : trade.result === "Loss"
                        ? "bg-trade-loss"
                        : "bg-trade-be",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm font-mono">
                      {trade.symbol}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 border",
                        getResultBg(trade.result),
                      )}
                    >
                      {trade.result === "BreakEven" ? "B/E" : trade.result}
                    </Badge>
                    <span className="text-[10px] text-gold ml-auto">
                      {displayGrade(trade.setupGrade)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {displaySession(trade.session)} · {trade.timeframe}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-bold font-mono",
                      trade.rMultiple >= 0
                        ? "text-trade-win"
                        : "text-trade-loss",
                    )}
                  >
                    {trade.rMultiple >= 0 ? "+" : ""}
                    {trade.rMultiple.toFixed(2)}R
                  </p>
                </div>
              </div>
            ))}
            {selectedTrades.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No trades found.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
