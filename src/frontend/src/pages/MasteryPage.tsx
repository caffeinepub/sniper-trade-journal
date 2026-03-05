import type { AppPage } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDrills } from "@/hooks/useQueries";
import { resolveScreenshotUrl } from "@/utils/screenshot";
import {
  BookOpen,
  Calendar,
  Flame,
  Plus,
  Swords,
  Target,
  TrendingUp,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Drill, ExternalBlob } from "../backend.d";

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
      data-ocid="mastery.dashboard.lightbox.modal"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-10"
        onClick={onClose}
        aria-label="Close lightbox"
        data-ocid="mastery.dashboard.lightbox.close_button"
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

/** Small thumbnail for the gallery */
function GalleryThumbnail({ screenshot }: { screenshot: ExternalBlob }) {
  const [url, setUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    resolveScreenshotUrl(screenshot).then(setUrl);
  }, [screenshot]);

  if (!url) return null;

  return (
    <>
      <button
        type="button"
        className="relative group aspect-square rounded-md overflow-hidden bg-muted border border-border hover:border-teal/40 transition-colors"
        onClick={() => setLightboxOpen(true)}
        aria-label="View screenshot"
        data-ocid="mastery.dashboard.screenshot.open_modal_button"
      >
        <img
          src={url}
          alt="Drill screenshot"
          loading="lazy"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/60 rounded-full p-1">
            <ZoomIn className="w-3 h-3 text-white" />
          </div>
        </div>
      </button>
      {lightboxOpen && (
        <ScreenshotLightbox url={url} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}

interface MasteryPageProps {
  onNavigate: (page: AppPage, drillId?: string) => void;
}

export default function MasteryPage({ onNavigate }: MasteryPageProps) {
  const { data: drillsData, isLoading } = useGetDrills();
  const drills: Drill[] = useMemo(() => drillsData ?? [], [drillsData]);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalDrills = drills.length;

  const mostPracticedSkill = useMemo(() => {
    if (drills.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const d of drills) {
      counts[d.drillType] = (counts[d.drillType] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [drills]);

  const lastSession = useMemo(() => {
    if (drills.length === 0) return null;
    return (
      drills.slice().sort((a, b) => b.date.localeCompare(a.date))[0]?.date ??
      null
    );
  }, [drills]);

  const thisWeek = useMemo(() => {
    return drills.filter((d) => new Date(`${d.date}T00:00:00`) >= sevenDaysAgo)
      .length;
  }, [drills, sevenDaysAgo]);

  const recentDrills = useMemo(() => {
    return drills
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [drills]);

  const screenshotDrills = useMemo(() => {
    return drills
      .filter((d) => !!d.screenshot)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [drills]);

  // Skill breakdown
  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of drills) {
      counts[d.drillType] = (counts[d.drillType] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [drills]);

  const maxSkillCount = skillCounts[0]?.[1] ?? 1;

  const stats = [
    {
      label: "Total Drills",
      value: totalDrills,
      icon: Target,
      color: "text-teal",
    },
    {
      label: "Most Practiced",
      value: mostPracticedSkill
        ? mostPracticedSkill.split(" ").slice(0, 2).join(" ")
        : "—",
      icon: Swords,
      color: "text-gold",
    },
    {
      label: "Last Session",
      value: lastSession ? formatDate(lastSession) : "No sessions yet",
      icon: Calendar,
      color: "text-trade-win",
    },
    {
      label: "This Week",
      value: thisWeek,
      icon: Flame,
      color: "text-trade-loss",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-teal-muted border border-teal/30 flex items-center justify-center shrink-0">
            <Swords className="w-4 h-4 text-teal" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Mastery</h1>
            <p className="text-sm text-muted-foreground">
              Training &amp; Skill Development
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="mastery.dashboard.primary_button"
            className="bg-teal hover:bg-teal/90 text-[oklch(var(--primary-foreground))] font-semibold gap-2"
            onClick={() => onNavigate("mastery-new-drill")}
          >
            <Plus className="w-4 h-4" />
            Start New Drill
          </Button>
          <Button
            data-ocid="mastery.dashboard.secondary_button"
            variant="outline"
            className="border-teal/30 text-teal hover:bg-teal-muted gap-2"
            onClick={() => onNavigate("mastery-journal")}
          >
            <BookOpen className="w-4 h-4" />
            Drill Journal
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          data-ocid="mastery.dashboard.loading_state"
        >
          {[1, 2, 3, 4].map((k) => (
            <Skeleton key={k} className="h-24 w-full bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 shrink-0 ${stat.color}`} />
                    <span className="text-xs text-muted-foreground truncate">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-lg font-bold font-mono leading-tight truncate">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Drills */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Drills
            </h2>
            {drills.length > 0 && (
              <button
                type="button"
                className="text-xs text-teal hover:underline"
                onClick={() => onNavigate("mastery-journal")}
                data-ocid="mastery.dashboard.link"
              >
                View all →
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((k) => (
                <Skeleton key={k} className="h-16 w-full bg-card" />
              ))}
            </div>
          ) : recentDrills.length === 0 ? (
            <div
              data-ocid="mastery.dashboard.empty_state"
              className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-lg"
            >
              <Swords className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No drills yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Start a drill to begin tracking your practice.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDrills.map((drill, i) => {
                const notePreview =
                  (
                    drill.structureNotes ||
                    drill.liquidityObservations ||
                    drill.induceNotes ||
                    drill.marketShiftObservations ||
                    drill.entryAnalysis ||
                    ""
                  ).slice(0, 90) || null;
                return (
                  <button
                    key={drill.id}
                    type="button"
                    data-ocid={`mastery.drill.item.${i + 1}`}
                    className="w-full text-left"
                    onClick={() => onNavigate("mastery-journal")}
                  >
                    <Card className="bg-card border-border card-hover cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-bold text-sm font-mono text-foreground">
                                {drill.symbol || "—"}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 border ${getDrillTypeColor(drill.drillType)}`}
                              >
                                {drill.drillType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatDate(drill.date)}</span>
                              {drill.timeframe && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono">
                                    {drill.timeframe}
                                  </span>
                                </>
                              )}
                            </div>
                            {notePreview && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {notePreview}
                              </p>
                            )}
                          </div>
                          <TrendingUp className="w-3 h-3 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Skill Breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Skill Breakdown
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((k) => (
                <Skeleton key={k} className="h-8 w-full bg-card" />
              ))}
            </div>
          ) : skillCounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                No skill data yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {skillCounts.map(([skill, count]) => (
                <div key={skill}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground/80 truncate pr-2">
                      {skill}
                    </span>
                    <span className="font-mono text-muted-foreground shrink-0">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full transition-all duration-500"
                      style={{
                        width: `${(count / maxSkillCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Gallery */}
      {screenshotDrills.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Screenshot Gallery
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {screenshotDrills.map((drill) =>
              drill.screenshot ? (
                <GalleryThumbnail
                  key={drill.id}
                  screenshot={drill.screenshot}
                />
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  );
}
