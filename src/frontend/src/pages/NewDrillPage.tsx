import type { AppPage } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import {
  useCreateDrill,
  useGetDrillById,
  useUpdateDrill,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { DrillInput } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const DRILL_TYPES = [
  "Market Structure Recognition",
  "Inducement Identification",
  "Liquidity Sweep Recognition",
  "Market Shift Confirmation",
  "Entry Refinement",
  "Full Model Practice",
] as const;

interface DrillFormState {
  date: string;
  symbol: string;
  timeframe: string;
  drillType: string;
  structureNotes: string;
  liquidityObservations: string;
  induceNotes: string;
  marketShiftObservations: string;
  entryAnalysis: string;
}

interface DrillFormErrors {
  date?: string;
  symbol?: string;
  drillType?: string;
}

const DEFAULT_FORM: DrillFormState = {
  date: new Date().toISOString().split("T")[0],
  symbol: "",
  timeframe: "",
  drillType: "",
  structureNotes: "",
  liquidityObservations: "",
  induceNotes: "",
  marketShiftObservations: "",
  entryAnalysis: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="text-[11px] text-trade-loss mt-1"
      data-ocid="drill.form.error_state"
    >
      {message}
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 shrink-0">
        {children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function validateForm(form: DrillFormState): DrillFormErrors {
  const errors: DrillFormErrors = {};
  if (!form.date) errors.date = "Date is required";
  if (!form.symbol.trim()) errors.symbol = "Symbol is required";
  if (!form.drillType) errors.drillType = "Drill type is required";
  return errors;
}

interface NewDrillPageProps {
  editDrillId?: string;
  onNavigate: (page: AppPage, id?: string) => void;
}

export default function NewDrillPage({
  editDrillId,
  onNavigate,
}: NewDrillPageProps) {
  const isEdit = !!editDrillId;
  const { data: existingDrill } = useGetDrillById(editDrillId ?? null);
  const createDrill = useCreateDrill();
  const updateDrill = useUpdateDrill();
  const { identity } = useInternetIdentity();
  const { actor, isFetching: isActorLoading } = useActor();
  const [waitingForActor, setWaitingForActor] = useState(false);
  const pendingSaveRef = useRef<"save" | "add" | null>(null);

  const [form, setForm] = useState<DrillFormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<DrillFormErrors>({});
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<
    string | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form from existing drill when editing
  useEffect(() => {
    if (existingDrill) {
      setForm({
        date: existingDrill.date,
        symbol: existingDrill.symbol,
        timeframe: existingDrill.timeframe,
        drillType: existingDrill.drillType,
        structureNotes: existingDrill.structureNotes,
        liquidityObservations: existingDrill.liquidityObservations,
        induceNotes: existingDrill.induceNotes,
        marketShiftObservations: existingDrill.marketShiftObservations,
        entryAnalysis: existingDrill.entryAnalysis,
      });
    }
  }, [existingDrill]);

  // Screenshot preview URL lifecycle
  useEffect(() => {
    if (!screenshotFile) {
      setScreenshotPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(screenshotFile);
    setScreenshotPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [screenshotFile]);

  // Keep actor ref fresh
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  // Auto-trigger save when actor becomes ready
  useEffect(() => {
    if (!waitingForActor || !actor || isActorLoading) return;
    if (!pendingSaveRef.current) return;
    const savedType = pendingSaveRef.current;
    pendingSaveRef.current = null;
    setWaitingForActor(false);
    if (savedType === "save") {
      _executeSave("save");
    } else {
      _executeSave("add");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, isActorLoading, waitingForActor]);

  const set = useCallback(
    <K extends keyof DrillFormState>(key: K, value: DrillFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setScreenshotFile(file);
  };

  const buildDrillInput = async (): Promise<DrillInput | null> => {
    let screenshot: ExternalBlob | undefined;
    if (screenshotFile) {
      try {
        const bytes = new Uint8Array(await screenshotFile.arrayBuffer());
        screenshot = ExternalBlob.fromBytes(bytes).withUploadProgress((p) =>
          setUploadProgress(p),
        );
      } catch {
        toast.error("Failed to process screenshot");
        return null;
      }
    } else if (isEdit && existingDrill?.screenshot) {
      // Retain existing screenshot if no new file selected
      screenshot = existingDrill.screenshot as unknown as ExternalBlob;
    }

    const input: DrillInput = {
      date: form.date,
      symbol: form.symbol.toUpperCase(),
      timeframe: form.timeframe,
      drillType: form.drillType,
      structureNotes: form.structureNotes,
      liquidityObservations: form.liquidityObservations,
      induceNotes: form.induceNotes,
      marketShiftObservations: form.marketShiftObservations,
      entryAnalysis: form.entryAnalysis,
      screenshot,
    };

    return input;
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setScreenshotFile(null);
    setUploadProgress(0);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const _executeSave = async (mode: "save" | "add") => {
    const currentActor = actorRef.current;
    if (!currentActor) {
      toast.error(
        "Could not connect to backend. Please refresh and try again.",
      );
      return;
    }

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const input = await buildDrillInput();
    if (!input) return;

    try {
      if (mode === "save") {
        if (isEdit && editDrillId) {
          await updateDrill.mutateAsync({ id: editDrillId, input });
          toast.success("Drill updated successfully");
        } else {
          await createDrill.mutateAsync(input);
          toast.success("Drill saved successfully.");
        }
        setUploadProgress(0);
        onNavigate("mastery-journal");
      } else {
        await createDrill.mutateAsync(input);
        toast.success("Drill saved successfully.");
        resetForm();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save drill";
      if (!identity) {
        toast.error("Please sign in to save drills");
      } else if (
        message.includes("Unauthorized") ||
        message.includes("not registered")
      ) {
        toast.error("Session expired. Please sign out and sign in again.");
      } else {
        toast.error(message || "Failed to save drill. Please try again.");
      }
    }
  };

  const handleSaveDrill = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error("Please sign in to save drills");
      return;
    }

    if (!actor || isActorLoading) {
      const validationErrors = validateForm(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;
      pendingSaveRef.current = "save";
      setWaitingForActor(true);
      toast.info("Connecting to backend, saving shortly...");
      return;
    }

    await _executeSave("save");
  };

  const handleSaveAndAddAnother = async () => {
    if (!identity) {
      toast.error("Please sign in to save drills");
      return;
    }

    if (!actor || isActorLoading) {
      const validationErrors = validateForm(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;
      pendingSaveRef.current = "add";
      setWaitingForActor(true);
      toast.info("Connecting to backend, saving shortly...");
      return;
    }

    await _executeSave("add");
  };

  const isPending = createDrill.isPending || updateDrill.isPending;

  return (
    <div className="p-4 md:p-6 pb-32 lg:pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate("mastery")}
          data-ocid="drill.form.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">
            {isEdit ? "Edit Drill" : "Start New Drill"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Chart analysis practice session
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveDrill} className="space-y-8 max-w-2xl">
        {/* Section 1: Basic Info */}
        <div>
          <SectionHeading>Drill Info</SectionHeading>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={cn(
                  "bg-muted border-border text-sm",
                  errors.date && "border-trade-loss/60",
                )}
                data-ocid="drill.form.date.input"
              />
              <FieldError message={errors.date} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Chart Symbol *
              </Label>
              <Input
                data-ocid="drill.form.symbol.input"
                placeholder="EURUSD, NAS100, XAUUSD..."
                value={form.symbol}
                onChange={(e) => set("symbol", e.target.value.toUpperCase())}
                className={cn(
                  "bg-muted border-border text-sm font-mono",
                  errors.symbol && "border-trade-loss/60",
                )}
              />
              <FieldError message={errors.symbol} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Timeframe</Label>
              <Input
                placeholder="1H, 15m, 4H, 1D..."
                value={form.timeframe}
                onChange={(e) => set("timeframe", e.target.value)}
                className="bg-muted border-border text-sm font-mono"
                data-ocid="drill.form.timeframe.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Drill Type *
              </Label>
              <Select
                value={form.drillType}
                onValueChange={(v) => set("drillType", v)}
              >
                <SelectTrigger
                  data-ocid="drill.form.drill_type.select"
                  className={cn(
                    "bg-muted border-border text-sm",
                    errors.drillType && "border-trade-loss/60",
                  )}
                >
                  <SelectValue placeholder="Select drill type..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {DRILL_TYPES.map((dt) => (
                    <SelectItem key={dt} value={dt}>
                      {dt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.drillType} />
            </div>
          </div>
        </div>

        {/* Section 2: Analysis Fields */}
        <div>
          <SectionHeading>Analysis Notes</SectionHeading>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Structure Notes
              </Label>
              <Textarea
                data-ocid="drill.form.structure_notes.textarea"
                placeholder="Describe the market structure you observed — higher highs, lower lows, ranges, BOS, CHoCH..."
                value={form.structureNotes}
                onChange={(e) => set("structureNotes", e.target.value)}
                className="bg-muted border-border text-sm min-h-20 resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Liquidity Observations
              </Label>
              <Textarea
                data-ocid="drill.form.liquidity_notes.textarea"
                placeholder="Note the liquidity levels — equal highs/lows, wick sweeps, stop hunts, buy-side or sell-side liquidity..."
                value={form.liquidityObservations}
                onChange={(e) => set("liquidityObservations", e.target.value)}
                className="bg-muted border-border text-sm min-h-20 resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Inducement Notes
              </Label>
              <Textarea
                data-ocid="drill.form.induce_notes.textarea"
                placeholder="Identify the nearest inducement — which pullback high/low was used to trap traders before the sweep?"
                value={form.induceNotes}
                onChange={(e) => set("induceNotes", e.target.value)}
                className="bg-muted border-border text-sm min-h-20 resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Market Shift Observations
              </Label>
              <Textarea
                data-ocid="drill.form.market_shift.textarea"
                placeholder="Did you see a market structure shift? Was it a valid shift or a fake reaction? What confirmed it?"
                value={form.marketShiftObservations}
                onChange={(e) => set("marketShiftObservations", e.target.value)}
                className="bg-muted border-border text-sm min-h-20 resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Entry Analysis
              </Label>
              <Textarea
                data-ocid="drill.form.entry_analysis.textarea"
                placeholder="Where would you enter? Identify liquidation candles, optimal entry zones, stop placement, and target areas..."
                value={form.entryAnalysis}
                onChange={(e) => set("entryAnalysis", e.target.value)}
                className="bg-muted border-border text-sm min-h-20 resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Screenshot */}
        <div>
          <SectionHeading>Chart Screenshot</SectionHeading>
          <div>
            <button
              type="button"
              data-ocid="drill.form.upload_button"
              className="w-full border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:border-teal/40 hover:bg-teal-muted/20 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {screenshotPreviewUrl ? (
                <div className="space-y-2">
                  <img
                    src={screenshotPreviewUrl}
                    alt="Screenshot preview"
                    className="w-full max-h-40 object-contain rounded-md mx-auto"
                  />
                  <p className="text-xs text-teal/80 truncate">
                    {screenshotFile?.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Click to replace
                  </p>
                </div>
              ) : isEdit && existingDrill?.screenshot ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Existing screenshot attached
                  </p>
                  <p className="text-[10px] text-teal/70">
                    Click to upload a new screenshot (replaces existing)
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">
                    Click to upload a chart screenshot
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    PNG, JPG, WebP supported
                  </p>
                </>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2 bg-muted rounded-full h-1">
                  <div
                    className="bg-teal h-full rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Submit — sticky on mobile */}
        <div className="fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto bg-background/95 backdrop-blur border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:p-0 lg:pb-0 lg:border-0 lg:bg-transparent z-50">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              data-ocid="drill.form.submit_button"
              type="submit"
              disabled={isPending || waitingForActor}
              className="flex-1 sm:flex-none bg-teal hover:bg-teal/90 text-[oklch(var(--primary-foreground))] font-semibold"
              size="lg"
            >
              {waitingForActor && pendingSaveRef.current === "save" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Saving..."}
                </>
              ) : isEdit ? (
                "Update Drill"
              ) : (
                "Save Drill"
              )}
            </Button>
            {!isEdit && (
              <Button
                data-ocid="drill.form.save_add_button"
                type="button"
                disabled={isPending || waitingForActor}
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-none border-teal/30 text-teal hover:bg-teal-muted font-semibold"
                onClick={handleSaveAndAddAnother}
              >
                {waitingForActor && pendingSaveRef.current === "add" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Add Another"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
