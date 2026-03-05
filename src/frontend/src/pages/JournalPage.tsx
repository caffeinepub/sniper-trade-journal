import type { AppPage } from "@/components/AppLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteTrade, useGetTrades } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { resolveScreenshotUrl } from "@/utils/screenshot";
import {
  displayGrade,
  displaySession,
  exportToCSV,
  formatDate,
  getDirectionColor,
  getResultBg,
} from "@/utils/trade";
import {
  ChevronRight,
  Download,
  Edit3,
  Filter,
  Minus,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  ZoomIn,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import type { ExternalBlob, Trade } from "../backend.d";

/** Lightbox with Escape key, swipe-to-dismiss, and natural image size. */
function ScreenshotLightbox({
  url,
  onClose,
  ocidPrefix,
}: {
  url: string;
  onClose: () => void;
  ocidPrefix: string;
}) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Swipe-to-dismiss (vertical or horizontal swipe > 60px)
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
      data-ocid={`${ocidPrefix}.lightbox.modal`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        type="button"
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-10"
        onClick={onClose}
        aria-label="Close lightbox"
        data-ocid={`${ocidPrefix}.lightbox.close_button`}
      >
        <X className="w-5 h-5" />
      </button>
      {/* Click-outside backdrop */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default"
        aria-label="Close lightbox overlay"
        onClick={onClose}
      />
      {/* Image at natural size, capped so it doesn't overflow viewport */}
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

interface JournalPageProps {
  onNavigate: (page: AppPage, tradeId?: string) => void;
}

// Hook to asynchronously resolve screenshot URL from ExternalBlob
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

function TradeDetailModal({
  trade,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  trade: Trade | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const screenshotUrl = useScreenshotUrl(trade?.screenshot);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Close lightbox when modal closes
  useEffect(() => {
    if (!open) setLightboxOpen(false);
  }, [open]);

  if (!trade) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          data-ocid="trade.detail.modal"
          className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold">
                {trade.symbol} — {formatDate(trade.date)}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  data-ocid="trade.detail.edit_button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-border"
                  onClick={onEdit}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  data-ocid="trade.detail.delete_button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-trade-loss/40 text-trade-loss hover:bg-trade-loss-muted"
                  onClick={onDelete}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
                <Button
                  data-ocid="trade.detail.close_button"
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
              <div>
                <p className="text-muted-foreground mb-1.5 uppercase tracking-wider text-[10px]">
                  Before
                </p>
                <div className="flex flex-wrap gap-1">
                  {trade.psychBefore.map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.5 bg-muted rounded text-foreground/70"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1.5 uppercase tracking-wider text-[10px]">
                  During
                </p>
                <div className="flex flex-wrap gap-1">
                  {trade.psychDuring.map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.5 bg-muted rounded text-foreground/70"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1.5 uppercase tracking-wider text-[10px]">
                  After
                </p>
                <div className="flex flex-wrap gap-1">
                  {trade.psychAfter.map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.5 bg-muted rounded text-foreground/70"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
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
                  data-ocid="trade.detail.screenshot.open_modal_button"
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

      {/* Full-size lightbox — rendered via portal to guarantee it sits above Dialog (z-50) */}
      {lightboxOpen && screenshotUrl && (
        <ScreenshotLightbox
          url={screenshotUrl}
          onClose={() => setLightboxOpen(false)}
          ocidPrefix="screenshot.detail"
        />
      )}
    </>
  );
}

export default function JournalPage({ onNavigate }: JournalPageProps) {
  const { data: tradesData, isLoading } = useGetTrades();
  const deleteTrade = useDeleteTrade();

  const [filterSymbol, setFilterSymbol] = useState("");
  const [filterSession, setFilterSession] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const trades: Trade[] = useMemo(() => {
    return tradesData ?? [];
  }, [tradesData]);

  const filteredTrades = useMemo(() => {
    return trades
      .filter((t) => {
        if (
          filterSymbol &&
          !t.symbol.toLowerCase().includes(filterSymbol.toLowerCase())
        )
          return false;
        if (filterSession !== "all" && t.session !== filterSession)
          return false;
        if (filterGrade !== "all" && t.setupGrade !== filterGrade) return false;
        if (filterResult !== "all" && t.result !== filterResult) return false;
        if (filterDateFrom && t.date < filterDateFrom) return false;
        if (filterDateTo && t.date > filterDateTo) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    trades,
    filterSymbol,
    filterSession,
    filterGrade,
    filterResult,
    filterDateFrom,
    filterDateTo,
  ]);

  const handleExport = useCallback(() => {
    exportToCSV(filteredTrades);
    toast.success("CSV exported successfully");
  }, [filteredTrades]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (id.startsWith("sample-")) {
        toast.error("Cannot delete sample trades");
        setDeleteConfirmId(null);
        return;
      }
      try {
        await deleteTrade.mutateAsync(id);
        toast.success("Trade deleted");
        setSelectedTrade(null);
        setDeleteConfirmId(null);
      } catch {
        toast.error("Failed to delete trade");
      }
    },
    [deleteTrade],
  );

  const handleEditTrade = useCallback(
    (trade: Trade) => {
      onNavigate("new-trade", trade.id);
      setSelectedTrade(null);
    },
    [onNavigate],
  );

  const clearFilters = () => {
    setFilterSymbol("");
    setFilterSession("all");
    setFilterGrade("all");
    setFilterResult("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasFilters =
    filterSymbol ||
    filterSession !== "all" ||
    filterGrade !== "all" ||
    filterResult !== "all" ||
    filterDateFrom ||
    filterDateTo;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Trade Journal</h1>
          <p className="text-sm text-muted-foreground">
            {filteredTrades.length} of {trades.length} trades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-ocid="journal.new_trade.primary_button"
            size="sm"
            className="bg-teal hover:bg-teal/90 text-[oklch(var(--primary-foreground))] font-semibold gap-1.5"
            onClick={() => onNavigate("new-trade")}
          >
            <Plus className="w-3.5 h-3.5" />
            New Trade
          </Button>
          <Button
            data-ocid="journal.export.button"
            size="sm"
            variant="outline"
            className="border-teal/30 text-teal hover:bg-teal-muted text-xs"
            onClick={handleExport}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Filters
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <Input
              data-ocid="journal.filter.symbol.input"
              placeholder="Symbol..."
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="h-8 text-xs bg-muted border-border"
            />
            <Select value={filterSession} onValueChange={setFilterSession}>
              <SelectTrigger
                data-ocid="journal.filter.session.select"
                className="h-8 text-xs bg-muted border-border"
              >
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="Asian">Asian</SelectItem>
                <SelectItem value="London">London</SelectItem>
                <SelectItem value="NewYork">New York</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger
                data-ocid="journal.filter.grade.select"
                className="h-8 text-xs bg-muted border-border"
              >
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="App">A++</SelectItem>
                <SelectItem value="Ap">A+</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterResult} onValueChange={setFilterResult}>
              <SelectTrigger
                data-ocid="journal.filter.result.select"
                className="h-8 text-xs bg-muted border-border"
              >
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="Win">Win</SelectItem>
                <SelectItem value="Loss">Loss</SelectItem>
                <SelectItem value="BreakEven">Break Even</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="From date"
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-8 text-xs bg-muted border-border"
            />
            <Input
              placeholder="To date"
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-8 text-xs bg-muted border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trade list */}
      {isLoading ? (
        <div className="space-y-2" data-ocid="journal.trade.loading_state">
          {["s1", "s2", "s3", "s4", "s5"].map((k) => (
            <Skeleton key={k} className="h-20 w-full bg-card" />
          ))}
        </div>
      ) : filteredTrades.length === 0 ? (
        <div
          data-ocid="journal.trade.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <BookIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            No trades match your filters.
          </p>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTrades.map((trade, index) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              index={index + 1}
              onClick={() => setSelectedTrade(trade)}
            />
          ))}
        </div>
      )}

      {/* Trade detail modal */}
      <TradeDetailModal
        trade={selectedTrade}
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
        onEdit={() => selectedTrade && handleEditTrade(selectedTrade)}
        onDelete={() => selectedTrade && setDeleteConfirmId(selectedTrade.id)}
      />

      {/* Delete confirm dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
      >
        <AlertDialogContent
          data-ocid="trade.delete.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The trade will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="trade.delete.cancel_button"
              className="border-border"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="trade.delete.confirm_button"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <title>No trades</title>
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function TradeCard({
  trade,
  index,
  onClick,
}: { trade: Trade; index: number; onClick: () => void }) {
  const resultBg = getResultBg(trade.result);
  const dirColor = getDirectionColor(trade.direction);
  const screenshotUrl = useScreenshotUrl(trade.screenshot);
  const [cardLightboxOpen, setCardLightboxOpen] = useState(false);

  return (
    <>
      <Card
        data-ocid={`journal.trade.item.${index}`}
        className="bg-card border-border card-hover cursor-pointer animate-fade-in"
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Result indicator */}
            <div
              className={cn(
                "w-1 self-stretch rounded-full shrink-0",
                trade.result === "Win"
                  ? "bg-trade-win"
                  : trade.result === "Loss"
                    ? "bg-trade-loss"
                    : "bg-trade-be",
              )}
            />

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-foreground font-mono">
                  {trade.symbol}
                </span>
                <Badge
                  className={cn("text-[10px] px-1.5 py-0 border", resultBg)}
                  variant="outline"
                >
                  {trade.result === "BreakEven" ? "B/E" : trade.result}
                </Badge>
                <span className={cn("text-xs font-semibold", dirColor)}>
                  {trade.direction === "Long" ? (
                    <TrendingUp className="w-3 h-3 inline" />
                  ) : (
                    <TrendingDown className="w-3 h-3 inline" />
                  )}{" "}
                  {trade.direction}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-gold/30 text-gold bg-gold-muted ml-auto hidden md:flex"
                >
                  {displayGrade(trade.setupGrade)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatDate(trade.date)}</span>
                <span className="hidden sm:block">·</span>
                <span className="hidden sm:block">
                  {displaySession(trade.session)}
                </span>
                <span className="hidden sm:block">·</span>
                <span className="hidden sm:block">{trade.timeframe}</span>
                {trade.setupType && (
                  <span className="hidden md:block truncate max-w-32">
                    · {trade.setupType}
                  </span>
                )}
              </div>
              {trade.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  <Tag className="w-2.5 h-2.5 text-teal/60 shrink-0" />
                  {trade.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-muted text-teal border border-teal/15"
                    >
                      {tag}
                    </span>
                  ))}
                  {trade.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{trade.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Screenshot thumbnail — click opens full lightbox directly */}
              {screenshotUrl && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <button
                    type="button"
                    className="relative group w-full text-left rounded-md overflow-hidden"
                    aria-label="View screenshot full size"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardLightboxOpen(true);
                    }}
                    data-ocid="trade.card.screenshot.open_modal_button"
                  >
                    <img
                      src={screenshotUrl}
                      alt="Trade screenshot"
                      loading="lazy"
                      className="w-full h-20 object-cover rounded-md opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/60 rounded-full p-1.5">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="text-right shrink-0 space-y-1">
              <div className="text-xs text-muted-foreground">
                RR:{" "}
                <span className="font-mono text-foreground">
                  {trade.rrRatio.toFixed(2)}R
                </span>
              </div>
              <div className="text-xs">
                <span
                  className={cn(
                    "font-mono font-bold",
                    trade.rMultiple >= 0 ? "text-trade-win" : "text-trade-loss",
                  )}
                >
                  {trade.rMultiple >= 0 ? "+" : ""}
                  {trade.rMultiple.toFixed(2)}R
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Card-level screenshot lightbox portal */}
      {cardLightboxOpen && screenshotUrl && (
        <ScreenshotLightbox
          url={screenshotUrl}
          onClose={() => setCardLightboxOpen(false)}
          ocidPrefix="screenshot.card"
        />
      )}
    </>
  );
}

// Suppress unused import lint
void Search;
void Minus;
