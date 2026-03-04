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
    return <div className="aspect-square" />;
  }

  const key = toDateKey(day);
  const todayKey = toDateKey(today);
  const dayTrades = tradesByDate[key] ?? [];
  const isToday = key === todayKey;
  const wins = dayTrades.filter((t) => t.result === "Win").length;
  const losses = dayTrades.filter((t) => t.result === "Loss").length;
  const bes = dayTrades.filter((t) => t.result === "BreakEven").length;
  const hasTrades = dayTrades.length > 0;
  const isPast = day <= today;

  return (
    <button
      type="button"
      key={key}
      onClick={() => {
        if (hasTrades) onSelect(key);
      }}
      className={cn(
        "aspect-square rounded-md p-1 text-xs transition-all flex flex-col items-center justify-start",
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
      {hasTrades && (
        <div className="flex gap-0.5 flex-wrap justify-center">
          {wins > 0 && (
            <div className="w-1.5 h-1.5 rounded-full bg-trade-win" />
          )}
          {wins > 1 && (
            <div className="w-1.5 h-1.5 rounded-full bg-trade-win" />
          )}
          {wins > 2 && (
            <div className="w-1.5 h-1.5 rounded-full bg-trade-win" />
          )}
          {losses > 0 && (
            <div className="w-1.5 h-1.5 rounded-full bg-trade-loss" />
          )}
          {losses > 1 && (
            <div className="w-1.5 h-1.5 rounded-full bg-trade-loss" />
          )}
          {losses > 2 && (
            <div className="w-1.5 h-1.5 rounded-full bg-trade-loss" />
          )}
          {bes > 0 && <div className="w-1.5 h-1.5 rounded-full bg-trade-be" />}
          {dayTrades.length > 6 && (
            <span className="text-[9px] text-muted-foreground">
              +{dayTrades.length - 6}
            </span>
          )}
        </div>
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
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
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
