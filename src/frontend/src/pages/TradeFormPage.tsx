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
  useCreateTrade,
  useGetTradeById,
  useUpdateTrade,
} from "@/hooks/useQueries";
import { useTealButtonTextClass } from "@/hooks/useTealButton";
import { cn } from "@/lib/utils";
import {
  GRADE_STORAGE,
  calcRMultiple,
  calcRR,
  displayGrade,
} from "@/utils/trade";
import { ArrowLeft, Loader2, Plus, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { TradeInput } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface TradeFormPageProps {
  editTradeId?: string;
  onNavigate: (page: AppPage) => void;
}

const PSYCH_BEFORE_OPTIONS = [
  "Calm",
  "Confident",
  "Excited",
  "Fearful",
  "Revenge mindset",
  "FOMO",
  "Hesitant",
];
const PSYCH_DURING_OPTIONS = [
  "Calm",
  "Anxious",
  "Wanted to exit early",
  "Wanted to move stop loss",
  "Overconfident",
  "Doubtful",
];
const PSYCH_AFTER_OPTIONS = [
  "Satisfied",
  "Frustrated",
  "Angry",
  "Proud",
  "Neutral",
  "Regretful",
];
const TAG_OPTIONS = [
  "Liquidity Sweep",
  "FVG",
  "Inducement",
  "SMT",
  "OB",
  "BOS",
  "CHoCH",
];
const GRADES = ["App", "Ap", "A", "B", "C"] as const;
const SESSIONS = ["Asian", "London", "NewYork"] as const;

interface FormState {
  date: string;
  symbol: string;
  session: string;
  timeframe: string;
  direction: string;
  biasBeforeEntry: string;
  setupType: string;
  entryReason: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  riskPercent: string;
  pnlPercent: string;
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
}

interface FormErrors {
  date?: string;
  symbol?: string;
  entryPrice?: string;
  stopLoss?: string;
  result?: string;
}

const DEFAULT_FORM: FormState = {
  date: new Date().toISOString().split("T")[0],
  symbol: "",
  session: "London",
  timeframe: "1H",
  direction: "Long",
  biasBeforeEntry: "Bullish",
  setupType: "",
  entryReason: "",
  entryPrice: "",
  stopLoss: "",
  takeProfit: "",
  riskPercent: "1",
  pnlPercent: "",
  result: "Win",
  psychBefore: [],
  psychDuring: [],
  psychAfter: [],
  followedRules: true,
  exitedEarly: false,
  movedStopLoss: false,
  setupGrade: "A",
  tags: [],
  mainLesson: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="text-[11px] text-trade-loss mt-1"
      data-ocid="trade.form.error_state"
    >
      {message}
    </p>
  );
}

function MultiSelectCheckboxes({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustomInput("");
  };

  return (
    <div>
      <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
        {label}
      </Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-all border",
              selected.includes(opt)
                ? "bg-teal-muted border-teal/40 text-teal"
                : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-border/80",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add custom..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          className="h-7 text-xs bg-muted border-border flex-1"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs border-border"
          onClick={addCustom}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      {selected.filter((s) => !options.includes(s)).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected
            .filter((s) => !options.includes(s))
            .map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-muted border border-teal/30 text-teal text-xs"
              >
                {s}
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  className="hover:text-trade-loss"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
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

function YesNoToggle({
  value,
  onChange,
  label,
}: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm text-foreground">{label}</Label>
      <div className="flex rounded-md overflow-hidden border border-border text-xs">
        <button
          type="button"
          className={cn(
            "px-3 py-1.5 transition-colors",
            value
              ? "bg-trade-win-muted text-trade-win font-semibold"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          type="button"
          className={cn(
            "px-3 py-1.5 transition-colors",
            !value
              ? "bg-trade-loss-muted text-trade-loss font-semibold"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.date) {
    errors.date = "Date is required";
  }

  if (!form.symbol.trim()) {
    errors.symbol = "Symbol is required";
  }

  const entry = Number.parseFloat(form.entryPrice);
  if (!form.entryPrice || Number.isNaN(entry) || entry <= 0) {
    errors.entryPrice = "Valid entry price is required";
  }

  const sl = Number.parseFloat(form.stopLoss);
  if (!form.stopLoss || Number.isNaN(sl) || sl <= 0) {
    errors.stopLoss = "Valid stop loss is required";
  }

  if (!form.result) {
    errors.result = "Result is required";
  }

  return errors;
}

export default function TradeFormPage({
  editTradeId,
  onNavigate,
}: TradeFormPageProps) {
  const isEdit = !!editTradeId;
  const { data: existingTrade } = useGetTradeById(editTradeId ?? null);
  const createTrade = useCreateTrade();
  const updateTrade = useUpdateTrade();
  const { identity } = useInternetIdentity();
  const { actor, isFetching: isActorLoading } = useActor();
  const tealTextClass = useTealButtonTextClass();
  const [waitingForActor, setWaitingForActor] = useState(false);
  // 'save' = go to journal after, 'add' = reset form and stay
  const pendingSaveRef = useRef<"save" | "add" | null>(null);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  // Keep a ref to always have the latest form for async callbacks (avoids stale closure)
  const formRef = useRef<FormState>(DEFAULT_FORM);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [customTag, setCustomTag] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<
    string | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form from existing trade
  useEffect(() => {
    if (existingTrade) {
      setForm({
        date: existingTrade.date,
        symbol: existingTrade.symbol,
        session: existingTrade.session,
        timeframe: existingTrade.timeframe,
        direction: existingTrade.direction,
        biasBeforeEntry: existingTrade.biasBeforeEntry,
        setupType: existingTrade.setupType,
        entryReason: existingTrade.entryReason,
        entryPrice: String(existingTrade.entryPrice),
        stopLoss: String(existingTrade.stopLoss),
        takeProfit: String(existingTrade.takeProfit),
        riskPercent: String(existingTrade.riskPercent),
        pnlPercent: String(existingTrade.pnlPercent),
        result: existingTrade.result,
        psychBefore: existingTrade.psychBefore,
        psychDuring: existingTrade.psychDuring,
        psychAfter: existingTrade.psychAfter,
        followedRules: existingTrade.followedRules,
        exitedEarly: existingTrade.exitedEarly,
        movedStopLoss: existingTrade.movedStopLoss,
        setupGrade: existingTrade.setupGrade,
        tags: existingTrade.tags,
        mainLesson: existingTrade.mainLesson,
      });
    }
  }, [existingTrade]);

  // Manage screenshot preview URL lifecycle
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

  // When actor becomes available after waiting, auto-trigger the pending save
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    if (!waitingForActor || !actor || isActorLoading) return;
    if (!pendingSaveRef.current) return;
    const savedType = pendingSaveRef.current;
    pendingSaveRef.current = null;
    setWaitingForActor(false);
    // Re-trigger the appropriate save path
    if (savedType === "save") {
      _executeSave("save");
    } else {
      _executeSave("add");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, isActorLoading, waitingForActor]);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Auto-calculated values
  const calculatedRR = useMemo(() => {
    const entry = Number.parseFloat(form.entryPrice);
    const sl = Number.parseFloat(form.stopLoss);
    const tp = Number.parseFloat(form.takeProfit);
    if (
      !Number.isNaN(entry) &&
      !Number.isNaN(sl) &&
      !Number.isNaN(tp) &&
      entry !== sl
    ) {
      return calcRR(entry, sl, tp);
    }
    return null;
  }, [form.entryPrice, form.stopLoss, form.takeProfit]);

  // Keep refs for async access in _executeSave to avoid stale closures
  const calculatedRRRef = useRef<number | null>(null);
  useEffect(() => {
    calculatedRRRef.current = calculatedRR;
  }, [calculatedRR]);

  const calculatedRMultiple = useMemo(() => {
    if (calculatedRR === null) return null;
    const risk = Number.parseFloat(form.riskPercent);
    const pnl = Number.parseFloat(form.pnlPercent);
    return calcRMultiple(
      form.result,
      calculatedRR,
      Number.isNaN(pnl) ? 0 : pnl,
      Number.isNaN(risk) ? 1 : risk,
    );
  }, [calculatedRR, form.result, form.riskPercent, form.pnlPercent]);

  const addTag = (tag: string) => {
    if (!form.tags.includes(tag)) {
      set("tags", [...form.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    set(
      "tags",
      form.tags.filter((t) => t !== tag),
    );
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !form.tags.includes(trimmed)) {
      set("tags", [...form.tags, trimmed]);
    }
    setCustomTag("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setScreenshotFile(file);
  };

  const buildTradeInput = async (): Promise<TradeInput | null> => {
    // Always read from refs to avoid stale closure values in async save paths
    const currentForm = formRef.current;
    const entry = Number.parseFloat(currentForm.entryPrice);
    const sl = Number.parseFloat(currentForm.stopLoss) || 0;
    const tp = Number.parseFloat(currentForm.takeProfit) || 0;
    const risk = Number.parseFloat(currentForm.riskPercent) || 1;
    const pnl = Number.parseFloat(currentForm.pnlPercent) || 0;
    const rrRatio = calculatedRRRef.current ?? 0;
    const rMultiple = calcRMultiple(currentForm.result, rrRatio, pnl, risk);

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
    }

    const input: TradeInput = {
      date: currentForm.date,
      symbol: currentForm.symbol.toUpperCase(),
      session: currentForm.session,
      timeframe: currentForm.timeframe,
      direction: currentForm.direction,
      biasBeforeEntry: currentForm.biasBeforeEntry,
      setupType: currentForm.setupType,
      entryReason: currentForm.entryReason,
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: tp,
      riskPercent: risk,
      pnlPercent: pnl,
      result: currentForm.result,
      rrRatio,
      rMultiple,
      psychBefore: currentForm.psychBefore,
      psychDuring: currentForm.psychDuring,
      psychAfter: currentForm.psychAfter,
      followedRules: currentForm.followedRules,
      exitedEarly: currentForm.exitedEarly,
      movedStopLoss: currentForm.movedStopLoss,
      setupGrade: currentForm.setupGrade,
      tags: currentForm.tags,
      mainLesson: currentForm.mainLesson,
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

  // Core save logic — called once actor is confirmed ready
  // Always reads from refs to avoid stale closure bugs
  const _executeSave = async (mode: "save" | "add") => {
    const currentActor = actorRef.current;
    if (!currentActor) {
      toast.error(
        "Could not connect to backend. Please refresh and try again.",
      );
      return;
    }

    // Use formRef to get the latest form state (avoids stale closure)
    const validationErrors = validateForm(formRef.current);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const input = await buildTradeInput();
    if (!input) return;

    try {
      if (mode === "save") {
        if (isEdit && editTradeId) {
          await updateTrade.mutateAsync({ id: editTradeId, input });
          toast.success("Trade updated successfully");
        } else {
          await createTrade.mutateAsync(input);
          toast.success("Trade saved successfully.");
        }
        setUploadProgress(0);
        onNavigate("journal");
      } else {
        await createTrade.mutateAsync(input);
        toast.success("Trade saved successfully.");
        resetForm();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save trade";
      if (!identity) {
        toast.error("Please sign in to save trades");
      } else if (
        message.includes("Unauthorized") ||
        message.includes("not registered")
      ) {
        toast.error("Session expired. Please sign out and sign in again.");
      } else {
        toast.error(message || "Failed to save trade. Please try again.");
      }
    }
  };

  const handleSaveTrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error("Please sign in to save trades");
      return;
    }

    // If actor isn't ready yet, queue the save and show a waiting state
    if (!actor || isActorLoading) {
      const validationErrors = validateForm(formRef.current);
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
      toast.error("Please sign in to save trades");
      return;
    }

    if (!actor || isActorLoading) {
      const validationErrors = validateForm(formRef.current);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;
      pendingSaveRef.current = "add";
      setWaitingForActor(true);
      toast.info("Connecting to backend, saving shortly...");
      return;
    }

    await _executeSave("add");
  };

  const isPending = createTrade.isPending || updateTrade.isPending;

  return (
    <div className="p-4 md:p-6 pb-32 lg:pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate("journal")}
          data-ocid="trade.form.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">
            {isEdit ? "Edit Trade" : "Log New Trade"}
          </h1>
          <p className="text-sm text-muted-foreground">
            ICT / SMC / Structure-based entry
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveTrade} className="space-y-8 max-w-2xl">
        {/* Section 1: Basic Info */}
        <div>
          <SectionHeading>Basic Info</SectionHeading>
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
                data-ocid="trade.form.date.input"
              />
              <FieldError message={errors.date} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Symbol *</Label>
              <Input
                data-ocid="trade.form.symbol.input"
                placeholder="EURUSD, NAS100..."
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
              <Label className="text-xs text-muted-foreground">Session</Label>
              <Select
                value={form.session}
                onValueChange={(v) => set("session", v)}
              >
                <SelectTrigger
                  data-ocid="trade.form.session.select"
                  className="bg-muted border-border text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {SESSIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "NewYork" ? "New York" : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Timeframe</Label>
              <Input
                placeholder="1H, 15m, 4H..."
                value={form.timeframe}
                onChange={(e) => set("timeframe", e.target.value)}
                className="bg-muted border-border text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Direction</Label>
              <div className="flex rounded-md overflow-hidden border border-border">
                {["Long", "Short"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={cn(
                      "flex-1 py-2 text-sm font-semibold transition-colors",
                      form.direction === d
                        ? d === "Long"
                          ? "bg-teal-muted text-teal"
                          : "bg-trade-loss-muted text-trade-loss"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => set("direction", d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Bias Before Entry
              </Label>
              <div className="flex rounded-md overflow-hidden border border-border">
                {["Bullish", "Bearish"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={cn(
                      "flex-1 py-2 text-sm font-semibold transition-colors",
                      form.biasBeforeEntry === b
                        ? b === "Bullish"
                          ? "bg-trade-win-muted text-trade-win"
                          : "bg-trade-loss-muted text-trade-loss"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => set("biasBeforeEntry", b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Setup Type
              </Label>
              <Input
                placeholder="OB + FVG, Liquidity Sweep, SMT..."
                value={form.setupType}
                onChange={(e) => set("setupType", e.target.value)}
                className="bg-muted border-border text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Reason for Entry
              </Label>
              <Textarea
                placeholder="Describe the full trade setup and reasoning..."
                value={form.entryReason}
                onChange={(e) => set("entryReason", e.target.value)}
                className="bg-muted border-border text-sm min-h-20 resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Risk & Execution */}
        <div>
          <SectionHeading>Risk & Execution</SectionHeading>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Entry Price *
              </Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.entryPrice}
                onChange={(e) => set("entryPrice", e.target.value)}
                className={cn(
                  "bg-muted border-border text-sm font-mono",
                  errors.entryPrice && "border-trade-loss/60",
                )}
                data-ocid="trade.form.entry_price.input"
              />
              <FieldError message={errors.entryPrice} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Stop Loss *
              </Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.stopLoss}
                onChange={(e) => set("stopLoss", e.target.value)}
                className={cn(
                  "bg-muted border-border text-sm font-mono text-trade-loss",
                  errors.stopLoss && "border-trade-loss/60",
                )}
                data-ocid="trade.form.stop_loss.input"
              />
              <FieldError message={errors.stopLoss} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Take Profit
              </Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.takeProfit}
                onChange={(e) => set("takeProfit", e.target.value)}
                className="bg-muted border-border text-sm font-mono text-trade-win"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Risk %</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="1.0"
                value={form.riskPercent}
                onChange={(e) => set("riskPercent", e.target.value)}
                className="bg-muted border-border text-sm font-mono"
              />
            </div>

            {/* Auto-calculated */}
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-md p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Risk:Reward (auto)
                </p>
                <p
                  className={cn(
                    "text-lg font-bold font-mono",
                    calculatedRR !== null && calculatedRR >= 2
                      ? "text-trade-win"
                      : "text-foreground",
                  )}
                >
                  {calculatedRR !== null ? `${calculatedRR.toFixed(2)}R` : "—"}
                </p>
              </div>
              <div className="bg-muted/50 rounded-md p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  R-Multiple (auto)
                </p>
                <p
                  className={cn(
                    "text-lg font-bold font-mono",
                    calculatedRMultiple !== null && calculatedRMultiple > 0
                      ? "text-trade-win"
                      : calculatedRMultiple !== null && calculatedRMultiple < 0
                        ? "text-trade-loss"
                        : "text-foreground",
                  )}
                >
                  {calculatedRMultiple !== null
                    ? `${calculatedRMultiple >= 0 ? "+" : ""}${calculatedRMultiple.toFixed(2)}R`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                P&L % (actual)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="3.00"
                value={form.pnlPercent}
                onChange={(e) => set("pnlPercent", e.target.value)}
                className="bg-muted border-border text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Result *</Label>
              <Select
                value={form.result}
                onValueChange={(v) => set("result", v)}
              >
                <SelectTrigger
                  data-ocid="trade.form.result.select"
                  className={cn(
                    "bg-muted border-border text-sm",
                    errors.result && "border-trade-loss/60",
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="Win">Win</SelectItem>
                  <SelectItem value="Loss">Loss</SelectItem>
                  <SelectItem value="BreakEven">Break Even</SelectItem>
                </SelectContent>
              </Select>
              <FieldError message={errors.result} />
            </div>
          </div>
        </div>

        {/* Section 3: Psychology */}
        <div>
          <SectionHeading>Psychology Tracking</SectionHeading>
          <div className="space-y-5">
            <MultiSelectCheckboxes
              label="Before Trade"
              options={PSYCH_BEFORE_OPTIONS}
              selected={form.psychBefore}
              onChange={(v) => set("psychBefore", v)}
            />
            <MultiSelectCheckboxes
              label="During Trade"
              options={PSYCH_DURING_OPTIONS}
              selected={form.psychDuring}
              onChange={(v) => set("psychDuring", v)}
            />
            <MultiSelectCheckboxes
              label="After Trade"
              options={PSYCH_AFTER_OPTIONS}
              selected={form.psychAfter}
              onChange={(v) => set("psychAfter", v)}
            />
          </div>
        </div>

        {/* Section 4: Discipline & Grading */}
        <div>
          <SectionHeading>Discipline & Grading</SectionHeading>
          <div className="space-y-4">
            <YesNoToggle
              label="Did I follow my rules?"
              value={form.followedRules}
              onChange={(v) => set("followedRules", v)}
            />
            <YesNoToggle
              label="Did I exit early?"
              value={form.exitedEarly}
              onChange={(v) => set("exitedEarly", v)}
            />
            <YesNoToggle
              label="Did I move my stop loss?"
              value={form.movedStopLoss}
              onChange={(v) => set("movedStopLoss", v)}
            />

            {/* Grade */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Setup Grade
              </Label>
              <div className="flex gap-2 flex-wrap">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    data-ocid="trade.form.grade.button"
                    onClick={() => set("setupGrade", g)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-bold transition-all border",
                      form.setupGrade === g
                        ? "bg-gold-muted border-gold/50 text-gold"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {displayGrade(g)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Tags
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      form.tags.includes(tag) ? removeTag(tag) : addTag(tag)
                    }
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                      form.tags.includes(tag)
                        ? "bg-teal-muted border-teal/40 text-teal"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  className="h-7 text-xs bg-muted border-border"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs border-border"
                  onClick={addCustomTag}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {form.tags.filter((t) => !TAG_OPTIONS.includes(t)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags
                    .filter((t) => !TAG_OPTIONS.includes(t))
                    .map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-muted border border-teal/30 text-teal text-xs"
                      >
                        {t}
                        <button type="button" onClick={() => removeTag(t)}>
                          <X className="w-2.5 h-2.5 hover:text-trade-loss" />
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Main Lesson */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Main Lesson From Trade
              </Label>
              <Textarea
                placeholder="What did this trade teach you? What will you do differently?"
                value={form.mainLesson}
                onChange={(e) => set("mainLesson", e.target.value)}
                className="bg-muted border-border text-sm min-h-24 resize-none"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Screenshot - own section for visibility */}
        <div>
          <SectionHeading>Trade Screenshot</SectionHeading>
          <div>
            <button
              type="button"
              data-ocid="trade.form.upload_button"
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
              ) : (
                <>
                  <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">
                    Click to upload trade screenshot
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    PNG, JPG, WebP supported
                  </p>
                </>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2 bg-muted rounded-full h-1">
                  <div
                    className="bg-teal h-full rounded-full"
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

        {/* Submit - sticky on mobile */}
        <div className="fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto bg-background/95 backdrop-blur border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:p-0 lg:pb-0 lg:border-0 lg:bg-transparent z-50">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              data-ocid="trade.form.submit_button"
              type="submit"
              disabled={isPending || waitingForActor}
              className={`flex-1 sm:flex-none bg-teal hover:bg-teal/90 ${tealTextClass} font-semibold`}
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
                "Update Trade"
              ) : (
                "Save Trade"
              )}
            </Button>
            {!isEdit && (
              <Button
                data-ocid="trade.form.save_add_button"
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

      {/* Suppress unused import lint */}
      {GRADE_STORAGE && null}
    </div>
  );
}
