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
import { useDeleteDrill, useGetDrills } from "@/hooks/useQueries";
import { useTealButtonTextClass } from "@/hooks/useTealButton";
import { cn } from "@/lib/utils";
import { resolveScreenshotUrl } from "@/utils/screenshot";
import {
  ChevronRight,
  Edit3,
  Filter,
  Plus,
  Swords,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import type { Drill, ExternalBlob } from "../backend.d";

const DRILL_TYPES = [
  "Market Structure Recognition",
  "Inducement Identification",
  "Liquidity Sweep Recognition",
  "Market Shift Confirmation",
  "Entry Refinement",
  "Full Model Practice",
];

const DRILL_TYPE_COLORS: Record<string, string> = {
  "Market Structure Recognition": "text-teal border-teal/30 bg-teal-muted",
  "Inducement Identification": "text-gold border-gold/30 bg-gold-muted",
  "Liquidity Sweep Recognition":
    "text-trade-win border-trade-win/30 bg-trade-win-muted",
  "Market Shift Confirmation":
    "text-trade-loss border-trade-loss/30 bg-trade-loss-muted",
  "Entry Refinement":
    "border-[oklch(0.68_0.12_280/0.3)] text-[oklch(0.68_0.12_280)] bg-[oklch(0.2_0.06_280)]",
  "Full Model Practice": "border-border text-foreground bg-muted",
};

function getDrillTypeColor(drillType: string): string {
  return (
    DRILL_TYPE_COLORS[drillType] ?? "border-border text-foreground bg-muted"
  );
}

function formatDate(d: string) {
  if (!d) return "—";
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Lightbox with Escape, swipe-to-dismiss, natural image size */
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
      data-ocid={`${ocidPrefix}.lightbox.modal`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-10"
        onClick={onClose}
        aria-label="Close lightbox"
        data-ocid={`${ocidPrefix}.lightbox.close_button`}
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
        alt="Drill screenshot"
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

/** Hook to resolve screenshot URL asynchronously */
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

function DrillDetailModal({
  drill,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  drill: Drill | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const screenshotUrl = useScreenshotUrl(drill?.screenshot);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!open) setLightboxOpen(false);
  }, [open]);

  if (!drill) return null;

  const noteSections = [
    { label: "Structure Notes", value: drill.structureNotes },
    { label: "Liquidity Observations", value: drill.liquidityObservations },
    { label: "Inducement Notes", value: drill.induceNotes },
    {
      label: "Market Shift Observations",
      value: drill.marketShiftObservations,
    },
    { label: "Entry Analysis", value: drill.entryAnalysis },
  ].filter((s) => s.value?.trim());

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          data-ocid="drill.detail.modal"
          className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <DialogTitle className="text-lg font-bold">
                {drill.symbol || "—"} — {formatDate(drill.date)}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  data-ocid="drill.detail.edit_button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-border"
                  onClick={onEdit}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  data-ocid="drill.detail.delete_button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-trade-loss/40 text-trade-loss hover:bg-trade-loss-muted"
                  onClick={onDelete}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
                <Button
                  data-ocid="drill.detail.close_button"
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
            {/* Info row */}
            <div className="flex flex-wrap gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">
                  Drill Type:
                </span>
                <Badge
                  variant="outline"
                  className={`ml-2 text-[10px] px-2 py-0.5 border ${getDrillTypeColor(drill.drillType)}`}
                >
                  {drill.drillType}
                </Badge>
              </div>
              {drill.timeframe && (
                <div>
                  <span className="text-muted-foreground text-xs">
                    Timeframe:
                  </span>
                  <span className="ml-2 font-mono text-sm">
                    {drill.timeframe}
                  </span>
                </div>
              )}
            </div>

            {/* Note sections */}
            {noteSections.map((section) => (
              <div key={section.label}>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  {section.label}
                </p>
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {section.value}
                </p>
              </div>
            ))}

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
                  data-ocid="drill.detail.screenshot.open_modal_button"
                >
                  <img
                    src={screenshotUrl}
                    alt="Drill screenshot"
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
          ocidPrefix="drill.detail"
        />
      )}
    </>
  );
}

interface DrillJournalPageProps {
  onNavigate: (page: AppPage, drillId?: string) => void;
}

export default function DrillJournalPage({
  onNavigate,
}: DrillJournalPageProps) {
  const { data: drillsData, isLoading } = useGetDrills();
  const deleteDrill = useDeleteDrill();
  const tealTextClass = useTealButtonTextClass();

  const [filterSymbol, setFilterSymbol] = useState("");
  const [filterDrillType, setFilterDrillType] = useState("all");
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const drills: Drill[] = useMemo(() => drillsData ?? [], [drillsData]);

  const filteredDrills = useMemo(() => {
    return drills
      .filter((d) => {
        if (
          filterSymbol &&
          !d.symbol.toLowerCase().includes(filterSymbol.toLowerCase())
        )
          return false;
        if (filterDrillType !== "all" && d.drillType !== filterDrillType)
          return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [drills, filterSymbol, filterDrillType]);

  const hasFilters = filterSymbol || filterDrillType !== "all";

  const clearFilters = () => {
    setFilterSymbol("");
    setFilterDrillType("all");
  };

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteDrill.mutateAsync(id);
        toast.success("Drill deleted");
        setSelectedDrill(null);
        setDeleteConfirmId(null);
      } catch {
        toast.error("Failed to delete drill");
      }
    },
    [deleteDrill],
  );

  const handleEditDrill = useCallback(
    (drill: Drill) => {
      onNavigate("mastery-new-drill", drill.id);
      setSelectedDrill(null);
    },
    [onNavigate],
  );

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Drill Journal</h1>
          <p className="text-sm text-muted-foreground">
            {filteredDrills.length} of {drills.length} drills
          </p>
        </div>
        <Button
          data-ocid="drill.journal.primary_button"
          className={`bg-teal hover:bg-teal/90 ${tealTextClass} font-semibold gap-2`}
          onClick={() => onNavigate("mastery-new-drill")}
          size="sm"
        >
          <Plus className="w-3.5 h-3.5" />
          New Drill
        </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              data-ocid="drill.journal.symbol.search_input"
              placeholder="Filter by symbol..."
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="h-8 text-xs bg-muted border-border"
            />
            <Select value={filterDrillType} onValueChange={setFilterDrillType}>
              <SelectTrigger
                data-ocid="drill.journal.drill_type.select"
                className="h-8 text-xs bg-muted border-border"
              >
                <SelectValue placeholder="Drill Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Types</SelectItem>
                {DRILL_TYPES.map((dt) => (
                  <SelectItem key={dt} value={dt}>
                    {dt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drill list */}
      {isLoading ? (
        <div className="space-y-2" data-ocid="drill.journal.loading_state">
          {[1, 2, 3, 4, 5].map((k) => (
            <Skeleton key={k} className="h-20 w-full bg-card" />
          ))}
        </div>
      ) : filteredDrills.length === 0 ? (
        <div
          data-ocid="drill.journal.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Swords className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            {hasFilters
              ? "No drills match your filters."
              : "No drills logged yet."}
          </p>
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          ) : (
            <Button
              data-ocid="drill.journal.start_drill.primary_button"
              size="sm"
              className={`mt-3 bg-teal hover:bg-teal/90 ${tealTextClass} gap-2`}
              onClick={() => onNavigate("mastery-new-drill")}
            >
              <Plus className="w-3.5 h-3.5" />
              Start First Drill
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDrills.map((drill, index) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              index={index + 1}
              onClick={() => setSelectedDrill(drill)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      <DrillDetailModal
        drill={selectedDrill}
        open={!!selectedDrill}
        onClose={() => setSelectedDrill(null)}
        onEdit={() => selectedDrill && handleEditDrill(selectedDrill)}
        onDelete={() => selectedDrill && setDeleteConfirmId(selectedDrill.id)}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
      >
        <AlertDialogContent
          data-ocid="drill.delete.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Drill</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The drill and its screenshot will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="drill.delete.cancel_button"
              className="border-border"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="drill.delete.confirm_button"
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

function DrillCard({
  drill,
  index,
  onClick,
}: { drill: Drill; index: number; onClick: () => void }) {
  const screenshotUrl = useScreenshotUrl(drill.screenshot);
  const [cardLightboxOpen, setCardLightboxOpen] = useState(false);

  const notePreview = (
    drill.structureNotes ||
    drill.liquidityObservations ||
    drill.induceNotes ||
    drill.marketShiftObservations ||
    drill.entryAnalysis ||
    ""
  ).slice(0, 100);

  return (
    <>
      <Card
        data-ocid={`drill.journal.item.${index}`}
        className="bg-card border-border card-hover cursor-pointer animate-fade-in"
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Left accent bar */}
            <div className="w-1 self-stretch rounded-full shrink-0 bg-teal/60" />

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-sm text-foreground font-mono">
                  {drill.symbol || "—"}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 border",
                    getDrillTypeColor(drill.drillType),
                  )}
                >
                  {drill.drillType}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(drill.date)}</span>
                {drill.timeframe && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{drill.timeframe}</span>
                  </>
                )}
              </div>
              {notePreview && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {notePreview}
                </p>
              )}

              {/* Screenshot thumbnail */}
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
                    data-ocid="drill.card.screenshot.open_modal_button"
                  >
                    <img
                      src={screenshotUrl}
                      alt="Drill screenshot"
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

            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Card-level screenshot lightbox */}
      {cardLightboxOpen && screenshotUrl && (
        <ScreenshotLightbox
          url={screenshotUrl}
          onClose={() => setCardLightboxOpen(false)}
          ocidPrefix="drill.card"
        />
      )}
    </>
  );
}
