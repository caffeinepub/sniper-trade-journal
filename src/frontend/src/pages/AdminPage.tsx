import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActor } from "@/hooks/useActor";
import { cn } from "@/lib/utils";
import { resolveScreenshotUrl } from "@/utils/screenshot";
import {
  displayGrade,
  displaySession,
  formatDate,
  getDirectionColor,
  getResultBg,
} from "@/utils/trade";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  ArrowLeft,
  ArrowUpDown,
  ChevronRight,
  Shield,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  X,
  ZoomIn,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type {
  Analytics,
  ExternalBlob,
  PlatformStats,
  Trade,
  UserStats,
} from "../backend.d";

// ─── Screenshot lightbox ────────────────────────────────────────────────────

function ScreenshotLightbox({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dy) > 60 || Math.abs(dx) > 60) onClose();
    touchStartY.current = null;
    touchStartX.current = null;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
      data-ocid="admin.lightbox.modal"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-10"
        onClick={onClose}
        aria-label="Close lightbox"
        data-ocid="admin.lightbox.close_button"
      >
        <X className="w-5 h-5" />
      </button>
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default"
        aria-label="Close lightbox overlay"
        onClick={onClose}
      />
      <img
        src={url}
        alt="Trade screenshot"
        className="relative z-10 rounded-md"
        style={{
          maxWidth: "min(95vw, 100%)",
          maxHeight: "90vh",
          width: "auto",
          height: "auto",
          objectFit: "contain",
        }}
      />
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none">
        Press Esc or swipe to close
      </p>
    </div>,
    document.body,
  );
}

// ─── Screenshot URL hook ─────────────────────────────────────────────────────

function useScreenshotUrl(screenshot?: ExternalBlob) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!screenshot) {
      setUrl(null);
      return;
    }
    resolveScreenshotUrl(screenshot).then(setUrl);
  }, [screenshot]);
  return url;
}

// ─── Truncate principal ──────────────────────────────────────────────────────

function truncatePrincipal(p: Principal | string): string {
  const s = typeof p === "string" ? p : p.toString();
  if (s.length <= 18) return s;
  return `${s.slice(0, 10)}…${s.slice(-6)}`;
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading,
  positive,
  negative,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.FC<{ className?: string }>;
  loading?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-7 w-24 bg-muted" />
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
          <div className="w-8 h-8 rounded-md bg-teal-muted flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-teal" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Read-only trade detail modal ────────────────────────────────────────────

function AdminTradeDetailModal({
  trade,
  open,
  onClose,
}: {
  trade: Trade | null;
  open: boolean;
  onClose: () => void;
}) {
  const screenshotUrl = useScreenshotUrl(trade?.screenshot);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!open) setLightboxOpen(false);
  }, [open]);

  if (!trade) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          data-ocid="admin.trade.detail.modal"
          className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold">
                {trade.symbol} — {formatDate(trade.date)}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-400/30 text-amber-400 bg-amber-400/5"
                >
                  <Shield className="w-2.5 h-2.5 mr-1" />
                  Read-only
                </Badge>
                <Button
                  data-ocid="admin.trade.detail.close_button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Key stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div
                className={cn(
                  "rounded-md px-3 py-2 border text-center",
                  getResultBg(trade.result),
                )}
              >
                <p className="text-[10px] uppercase tracking-wider mb-0.5 opacity-70">
                  Result
                </p>
                <p className="text-sm font-bold">
                  {trade.result === "BreakEven" ? "B/E" : trade.result}
                </p>
              </div>
              <div className="rounded-md px-3 py-2 bg-muted border border-border text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  R:R
                </p>
                <p className="text-sm font-bold font-mono">
                  {trade.rrRatio.toFixed(2)}R
                </p>
              </div>
              <div
                className={cn(
                  "rounded-md px-3 py-2 border text-center",
                  trade.rMultiple >= 0
                    ? "bg-trade-win-muted border-trade-win/30"
                    : "bg-trade-loss-muted border-trade-loss/30",
                )}
              >
                <p className="text-[10px] uppercase tracking-wider mb-0.5 opacity-70">
                  R-Multiple
                </p>
                <p
                  className={cn(
                    "text-sm font-bold font-mono",
                    trade.rMultiple >= 0 ? "text-trade-win" : "text-trade-loss",
                  )}
                >
                  {trade.rMultiple >= 0 ? "+" : ""}
                  {trade.rMultiple.toFixed(2)}R
                </p>
              </div>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">
                  Direction:
                </span>
                <span
                  className={cn(
                    "ml-2 font-semibold",
                    getDirectionColor(trade.direction),
                  )}
                >
                  {trade.direction}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Session:</span>
                <span className="ml-2 font-medium">
                  {displaySession(trade.session)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  Timeframe:
                </span>
                <span className="ml-2 font-mono">{trade.timeframe}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Bias:</span>
                <span
                  className={cn(
                    "ml-2 font-medium",
                    trade.biasBeforeEntry === "Bullish"
                      ? "text-trade-win"
                      : "text-trade-loss",
                  )}
                >
                  {trade.biasBeforeEntry}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  Setup Type:
                </span>
                <span className="ml-2">{trade.setupType}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Grade:</span>
                <span className="ml-2 font-bold text-gold">
                  {displayGrade(trade.setupGrade)}
                </span>
              </div>
            </div>

            {/* Prices */}
            <div className="bg-muted/50 rounded-md p-3 grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">Entry</p>
                <p className="font-mono font-semibold">{trade.entryPrice}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">Stop Loss</p>
                <p className="font-mono font-semibold text-trade-loss">
                  {trade.stopLoss}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">Take Profit</p>
                <p className="font-mono font-semibold text-trade-win">
                  {trade.takeProfit}
                </p>
              </div>
            </div>

            {/* Reason for entry */}
            {trade.entryReason && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  Entry Reason
                </p>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {trade.entryReason}
                </p>
              </div>
            )}

            {/* Psychology */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              {(["Before", "During", "After"] as const).map((phase) => {
                const arr =
                  phase === "Before"
                    ? trade.psychBefore
                    : phase === "During"
                      ? trade.psychDuring
                      : trade.psychAfter;
                return (
                  <div key={phase}>
                    <p className="text-muted-foreground mb-1.5 uppercase tracking-wider text-[10px]">
                      {phase}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {arr.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 bg-muted rounded text-foreground/70"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Discipline */}
            <div className="flex gap-4 text-xs">
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  trade.followedRules ? "text-trade-win" : "text-trade-loss",
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    trade.followedRules ? "bg-trade-win" : "bg-trade-loss",
                  )}
                />
                Rules: {trade.followedRules ? "Yes" : "No"}
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  trade.exitedEarly ? "text-gold" : "text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    trade.exitedEarly ? "bg-gold" : "bg-muted",
                  )}
                />
                Early exit: {trade.exitedEarly ? "Yes" : "No"}
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  trade.movedStopLoss ? "text-gold" : "text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    trade.movedStopLoss ? "bg-gold" : "bg-muted",
                  )}
                />
                Moved SL: {trade.movedStopLoss ? "Yes" : "No"}
              </div>
            </div>

            {/* Tags */}
            {trade.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {trade.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-teal-muted border border-teal/20 text-teal text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Main Lesson */}
            {trade.mainLesson && (
              <div className="bg-gold-muted border border-gold/20 rounded-md p-3">
                <p className="text-[10px] text-gold uppercase tracking-wider mb-1">
                  Main Lesson
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {trade.mainLesson}
                </p>
              </div>
            )}

            {/* Screenshot */}
            {screenshotUrl && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider text-[10px]">
                  Screenshot
                </p>
                <button
                  type="button"
                  className="relative group cursor-pointer w-full text-left rounded-md overflow-hidden"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Click to enlarge screenshot"
                  data-ocid="admin.trade.screenshot.open_modal_button"
                >
                  <img
                    src={screenshotUrl}
                    alt="Trade screenshot"
                    loading="lazy"
                    className="rounded-md w-full object-contain max-h-60 bg-muted transition-opacity group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/60 rounded-full p-2">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </button>
                <p className="text-[10px] text-muted-foreground mt-1 text-center">
                  Click to enlarge
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {lightboxOpen && screenshotUrl && (
        <ScreenshotLightbox
          url={screenshotUrl}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// ─── User Detail sub-view ────────────────────────────────────────────────────

function UserDetailView({
  principal,
  onBack,
}: {
  principal: Principal;
  onBack: () => void;
}) {
  const { actor, isFetching: actorFetching } = useActor();
  const [stats, setStats] = useState<Analytics | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  useEffect(() => {
    if (!actor || actorFetching) return;
    setLoading(true);
    setError(null);
    Promise.all([
      actor.adminGetUserStats(principal),
      actor.adminGetUserTrades(principal),
    ])
      .then(([s, t]) => {
        setStats(s);
        setTrades(
          t.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        );
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load user data. You may not have admin access.");
      })
      .finally(() => setLoading(false));
  }, [actor, actorFetching, principal]);

  const joinDate =
    trades.length > 0
      ? formatDate(
          [...trades].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          )[0].date,
        )
      : "—";

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onBack}
          data-ocid="admin.user_detail.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-400/30 text-amber-400 bg-amber-400/5 text-[11px]"
          >
            <Shield className="w-3 h-3 mr-1" />
            Read-only view
          </Badge>
        </div>
      </div>

      {error && (
        <div
          data-ocid="admin.user_detail.error_state"
          className="bg-destructive/10 border border-destructive/30 rounded-md p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Profile header card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-muted border border-teal/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-teal" />
            </div>
            <div>
              <CardTitle className="text-base font-mono">
                {truncatePrincipal(principal)}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Joined: {joinDate}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
              data-ocid="admin.user_detail.loading_state"
            >
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 bg-muted rounded-md" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-md p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Total Trades
                </p>
                <p className="text-xl font-bold font-mono">
                  {Number(stats.totalTrades)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-md p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Win Rate
                </p>
                <p
                  className={cn(
                    "text-xl font-bold font-mono",
                    stats.winRate > 50 ? "text-trade-win" : "text-trade-loss",
                  )}
                >
                  {stats.winRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-md p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Avg RR
                </p>
                <p className="text-xl font-bold font-mono text-foreground">
                  {stats.avgRR.toFixed(2)}R
                </p>
              </div>
              <div className="bg-muted/50 rounded-md p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Net R
                </p>
                <p
                  className={cn(
                    "text-xl font-bold font-mono",
                    stats.totalNetR >= 0 ? "text-trade-win" : "text-trade-loss",
                  )}
                >
                  {stats.totalNetR >= 0 ? "+" : ""}
                  {stats.totalNetR.toFixed(2)}R
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Trade log */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Trade Log ({trades.length} trades)
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 bg-card rounded-md" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div
            data-ocid="admin.user_trades.empty_state"
            className="flex flex-col items-center justify-center py-12 text-center bg-card border border-border rounded-lg"
          >
            <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              No trades logged yet.
            </p>
          </div>
        ) : (
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Symbol
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden sm:table-cell">
                    Session
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden md:table-cell">
                    Dir
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden lg:table-cell">
                    Setup
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    RR
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Result
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden md:table-cell">
                    Grade
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden lg:table-cell">
                    Screenshot
                  </TableHead>
                  <TableHead className="w-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade, index) => (
                  <AdminTradeRow
                    key={trade.id}
                    trade={trade}
                    index={index + 1}
                    onClick={() => setSelectedTrade(trade)}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <AdminTradeDetailModal
        trade={selectedTrade}
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
}

function AdminTradeRow({
  trade,
  index,
  onClick,
}: {
  trade: Trade;
  index: number;
  onClick: () => void;
}) {
  const screenshotUrl = useScreenshotUrl(trade.screenshot);

  return (
    <TableRow
      data-ocid={`admin.trade.item.${index}`}
      className="border-border cursor-pointer hover:bg-muted/40 transition-colors"
      onClick={onClick}
    >
      <TableCell className="text-xs font-mono text-muted-foreground py-2.5">
        {formatDate(trade.date)}
      </TableCell>
      <TableCell className="text-xs font-mono font-bold py-2.5">
        {trade.symbol}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground py-2.5 hidden sm:table-cell">
        {displaySession(trade.session)}
      </TableCell>
      <TableCell className="py-2.5 hidden md:table-cell">
        <span
          className={cn(
            "text-xs font-semibold",
            getDirectionColor(trade.direction),
          )}
        >
          {trade.direction === "Long" ? (
            <TrendingUp className="w-3 h-3 inline mr-0.5" />
          ) : (
            <TrendingDown className="w-3 h-3 inline mr-0.5" />
          )}
          {trade.direction}
        </span>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground py-2.5 hidden lg:table-cell max-w-28">
        <span className="truncate block">{trade.setupType || "—"}</span>
      </TableCell>
      <TableCell className="text-xs font-mono py-2.5">
        {trade.rrRatio.toFixed(2)}R
      </TableCell>
      <TableCell className="py-2.5">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 border",
            getResultBg(trade.result),
          )}
        >
          {trade.result === "BreakEven" ? "B/E" : trade.result}
        </Badge>
      </TableCell>
      <TableCell className="py-2.5 hidden md:table-cell">
        <span className="text-[11px] font-bold text-gold">
          {displayGrade(trade.setupGrade)}
        </span>
      </TableCell>
      <TableCell className="py-2.5 hidden lg:table-cell">
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt="screenshot"
            loading="lazy"
            className="w-10 h-7 object-cover rounded border border-border"
          />
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="py-2.5">
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
      </TableCell>
    </TableRow>
  );
}

// ─── Leaderboard sub-view ────────────────────────────────────────────────────

type SortKey = "totalNetR" | "winRate" | "totalTrades" | "avgRMultiple";

function LeaderboardView({
  onBack,
  onSelectUser,
}: {
  onBack: () => void;
  onSelectUser: (p: Principal) => void;
}) {
  const { actor, isFetching: actorFetching } = useActor();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("totalNetR");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!actor || actorFetching) return;
    setLoading(true);
    setError(null);
    actor
      .adminGetAllUsers()
      .then((data) => setUsers(data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load leaderboard. You may not have admin access.");
      })
      .finally(() => setLoading(false));
  }, [actor, actorFetching]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let av: number;
    let bv: number;
    switch (sortKey) {
      case "totalNetR":
        av = a.totalNetR;
        bv = b.totalNetR;
        break;
      case "winRate":
        av = a.winRate;
        bv = b.winRate;
        break;
      case "totalTrades":
        av = Number(a.totalTrades);
        bv = Number(b.totalTrades);
        break;
      case "avgRMultiple":
        av = a.avgRMultiple;
        bv = b.avgRMultiple;
        break;
    }
    return sortAsc ? av - bv : bv - av;
  });

  const SortHeader = ({ col, label }: { col: SortKey; label: string }) => (
    <TableHead
      className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={cn(
            "w-3 h-3 transition-opacity",
            sortKey === col ? "opacity-100 text-teal" : "opacity-40",
          )}
        />
      </span>
    </TableHead>
  );

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onBack}
          data-ocid="admin.leaderboard.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Button>
        <div className="ml-auto">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            Performance Leaderboard
          </h1>
        </div>
      </div>

      {error && (
        <div
          data-ocid="admin.leaderboard.error_state"
          className="bg-destructive/10 border border-destructive/30 rounded-md p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2" data-ocid="admin.leaderboard.loading_state">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 bg-card rounded-md" />
          ))}
        </div>
      ) : sortedUsers.length === 0 ? (
        <div
          data-ocid="admin.leaderboard.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-lg"
        >
          <Trophy className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            No users with trades yet.
          </p>
        </div>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground w-12">
                  #
                </TableHead>
                <TableHead className="text-xs text-muted-foreground">
                  User
                </TableHead>
                <SortHeader col="totalTrades" label="Trades" />
                <SortHeader col="winRate" label="Win Rate" />
                <SortHeader col="avgRMultiple" label="Avg R-Mult" />
                <SortHeader col="totalNetR" label="Net R" />
                <TableHead className="text-xs text-muted-foreground hidden md:table-cell">
                  Last Trade
                </TableHead>
                <TableHead className="w-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user, index) => (
                <TableRow
                  key={user.owner.toString()}
                  data-ocid={`admin.leaderboard.item.${index + 1}`}
                  className="border-border cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => onSelectUser(user.owner)}
                >
                  <TableCell className="py-3">
                    <span
                      className={cn(
                        "text-sm font-bold font-mono",
                        index === 0 && "text-gold",
                        index === 1 && "text-muted-foreground",
                        index === 2 && "text-amber-700",
                        index > 2 && "text-muted-foreground/60",
                      )}
                    >
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-xs font-mono text-foreground">
                      {truncatePrincipal(user.owner)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono py-3">
                    {Number(user.totalTrades)}
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={cn(
                        "text-xs font-mono font-semibold",
                        user.winRate > 50
                          ? "text-trade-win"
                          : "text-trade-loss",
                      )}
                    >
                      {user.winRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={cn(
                        "text-xs font-mono font-semibold",
                        user.avgRMultiple >= 0
                          ? "text-trade-win"
                          : "text-trade-loss",
                      )}
                    >
                      {user.avgRMultiple >= 0 ? "+" : ""}
                      {user.avgRMultiple.toFixed(2)}R
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={cn(
                        "text-xs font-mono font-bold",
                        user.totalNetR >= 0
                          ? "text-trade-win"
                          : "text-trade-loss",
                      )}
                    >
                      {user.totalNetR >= 0 ? "+" : ""}
                      {user.totalNetR.toFixed(2)}R
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground py-3 hidden md:table-cell font-mono">
                    {user.mostRecentTradeDate
                      ? formatDate(user.mostRecentTradeDate)
                      : "—"}
                  </TableCell>
                  <TableCell className="py-3">
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ─── Overview sub-view ───────────────────────────────────────────────────────

function OverviewView({
  onGoToLeaderboard,
}: { onGoToLeaderboard: () => void }) {
  const { actor, isFetching: actorFetching } = useActor();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(
    null,
  );
  const [allUsers, setAllUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || actorFetching) return;
    setLoading(true);
    setError(null);
    Promise.all([actor.adminGetPlatformStats(), actor.adminGetAllUsers()])
      .then(([stats, users]) => {
        setPlatformStats(stats);
        setAllUsers(users);
      })
      .catch((err) => {
        console.error(err);
        setError(
          "Failed to load platform data. You may not have admin access.",
        );
      })
      .finally(() => setLoading(false));
  }, [actor, actorFetching]);

  // 5 most recently active users
  const recentlyActive = [...allUsers]
    .sort((a, b) => {
      if (!a.mostRecentTradeDate) return 1;
      if (!b.mostRecentTradeDate) return -1;
      return (
        new Date(b.mostRecentTradeDate).getTime() -
        new Date(a.mostRecentTradeDate).getTime()
      );
    })
    .slice(0, 5);

  // Top 5 by trade count for chart
  const top5ByTrades = [...allUsers]
    .sort((a, b) => Number(b.totalTrades) - Number(a.totalTrades))
    .slice(0, 5)
    .map((u, i) => ({
      name: truncatePrincipal(u.owner),
      trades: Number(u.totalTrades),
      fill:
        i === 0
          ? "var(--teal)"
          : i === 1
            ? "var(--chart-2)"
            : "var(--muted-foreground)",
    }));

  const chartColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--teal")
    .trim();

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              Platform overview — read-only
            </p>
          </div>
        </div>
        <Button
          data-ocid="admin.overview.leaderboard.button"
          size="sm"
          className="bg-teal hover:bg-teal/90 text-white gap-2"
          onClick={onGoToLeaderboard}
        >
          <Trophy className="w-3.5 h-3.5" />
          View Leaderboard
        </Button>
      </div>

      {error && (
        <div
          data-ocid="admin.overview.error_state"
          className="bg-destructive/10 border border-destructive/30 rounded-md p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Total Users"
          value={
            loading
              ? "—"
              : String(Number(platformStats?.totalUsersWithTrades ?? 0))
          }
          subtitle="with trades"
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Total Trades"
          value={
            loading ? "—" : String(Number(platformStats?.totalTrades ?? 0))
          }
          subtitle="across all users"
          icon={Activity}
          loading={loading}
        />
        <StatCard
          title="Avg Win Rate"
          value={
            loading ? "—" : `${(platformStats?.avgWinRate ?? 0).toFixed(1)}%`
          }
          subtitle="platform average"
          icon={TrendingUp}
          loading={loading}
          positive={!loading && (platformStats?.avgWinRate ?? 0) > 50}
          negative={!loading && (platformStats?.avgWinRate ?? 0) <= 50}
        />
        <StatCard
          title="Most Active"
          value={
            loading
              ? "—"
              : platformStats?.mostActiveTrader
                ? truncatePrincipal(platformStats.mostActiveTrader)
                : "—"
          }
          subtitle="by trade count"
          icon={Trophy}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart — top 5 traders */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal" />
              Top Traders by Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton
                className="h-40 bg-muted rounded-md"
                data-ocid="admin.chart.loading_state"
              />
            ) : top5ByTrades.length === 0 ? (
              <div
                data-ocid="admin.chart.empty_state"
                className="h-40 flex items-center justify-center text-muted-foreground text-sm"
              >
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={top5ByTrades}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={`oklch(${chartColor} / 0.1)`}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: "currentColor", opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "currentColor", opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: "oklch(var(--card))",
                      border: "1px solid oklch(var(--border))",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                    labelStyle={{ color: "oklch(var(--foreground))" }}
                    itemStyle={{ color: "oklch(var(--teal))" }}
                  />
                  <Bar dataKey="trades" radius={[3, 3, 0, 0]}>
                    {top5ByTrades.map((_entry, i) => (
                      <Cell
                        key={top5ByTrades[i].name}
                        fill={
                          i === 0
                            ? "oklch(var(--teal))"
                            : i === 1
                              ? "oklch(var(--chart-2))"
                              : "oklch(var(--muted-foreground) / 0.4)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div
                className="space-y-2"
                data-ocid="admin.recent_activity.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 bg-muted rounded-md" />
                ))}
              </div>
            ) : recentlyActive.length === 0 ? (
              <div
                data-ocid="admin.recent_activity.empty_state"
                className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm"
              >
                No activity yet
              </div>
            ) : (
              <div className="space-y-2">
                {recentlyActive.map((user, index) => (
                  <div
                    key={user.owner.toString()}
                    data-ocid={`admin.recent_activity.item.${index + 1}`}
                    className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/40"
                  >
                    <div className="w-6 h-6 rounded-full bg-teal-muted border border-teal/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-teal">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate">
                        {truncatePrincipal(user.owner)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {Number(user.totalTrades)} trades ·{" "}
                        {user.winRate.toFixed(1)}% win rate
                      </p>
                    </div>
                    {user.mostRecentTradeDate && (
                      <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                        {formatDate(user.mostRecentTradeDate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main AdminPage ──────────────────────────────────────────────────────────

type AdminSubView = "overview" | "leaderboard" | "user-detail";

export default function AdminPage() {
  const [subView, setSubView] = useState<AdminSubView>("overview");
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(
    null,
  );

  const handleSelectUser = useCallback((p: Principal) => {
    setSelectedPrincipal(p);
    setSubView("user-detail");
  }, []);

  const handleGoToLeaderboard = useCallback(() => {
    setSubView("leaderboard");
  }, []);

  const handleBackToOverview = useCallback(() => {
    setSubView("overview");
    setSelectedPrincipal(null);
  }, []);

  const handleBackToLeaderboard = useCallback(() => {
    setSubView("leaderboard");
    setSelectedPrincipal(null);
  }, []);

  return (
    <div data-ocid="admin.page">
      {subView === "overview" && (
        <OverviewView onGoToLeaderboard={handleGoToLeaderboard} />
      )}
      {subView === "leaderboard" && (
        <LeaderboardView
          onBack={handleBackToOverview}
          onSelectUser={handleSelectUser}
        />
      )}
      {subView === "user-detail" && selectedPrincipal && (
        <UserDetailView
          principal={selectedPrincipal}
          onBack={handleBackToLeaderboard}
        />
      )}
    </div>
  );
}
