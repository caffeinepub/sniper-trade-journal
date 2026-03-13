import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import {
  Archive,
  Building2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { InstitutionalNews, InstitutionalNewsInput } from "../backend.d";

interface InstitutionalPageProps {
  isAdmin?: boolean;
}

const INSTITUTIONS = [
  "Goldman Sachs",
  "JPMorgan Chase",
  "Morgan Stanley",
  "Citigroup",
  "Bank of America",
  "European Central Bank",
  "Federal Reserve",
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CHF", "NZD"];

const INSTITUTION_COLORS: Record<string, string> = {
  "Goldman Sachs": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "JPMorgan Chase": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Morgan Stanley": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Citigroup: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "Bank of America": "bg-red-500/15 text-red-400 border-red-500/30",
  "European Central Bank":
    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Federal Reserve": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const SENTIMENT_STYLES: Record<string, string> = {
  Bullish: "bg-trade-win/15 text-trade-win border-trade-win/30",
  Bearish: "bg-trade-loss/15 text-trade-loss border-trade-loss/30",
  Neutral: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

const ARCHIVE_THRESHOLD_DAYS = 30;

function isArchived(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs > ARCHIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

function NewsCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-5/6 mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function AddNewsModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: InstitutionalNewsInput) => Promise<void>;
}) {
  const [form, setForm] = useState<InstitutionalNewsInput>({
    institution: "",
    headline: "",
    summary: "",
    currency: "",
    sentiment: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (
      !form.institution ||
      !form.headline ||
      !form.summary ||
      !form.currency ||
      !form.sentiment ||
      !form.date
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm({
        institution: "",
        headline: "",
        summary: "",
        currency: "",
        sentiment: "",
        date: new Date().toISOString().split("T")[0],
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-lg"
        data-ocid="institutional.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Add Institutional News
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-foreground mb-1 block">Institution</Label>
            <Select
              value={form.institution}
              onValueChange={(v) => setForm((p) => ({ ...p, institution: v }))}
            >
              <SelectTrigger
                className="bg-background border-border"
                data-ocid="institutional.institution.select"
              >
                <SelectValue placeholder="Select institution" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {INSTITUTIONS.map((inst) => (
                  <SelectItem key={inst} value={inst}>
                    {inst}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-foreground mb-1 block">Headline</Label>
            <Input
              data-ocid="institutional.headline.input"
              className="bg-background border-border"
              placeholder="e.g. USD expected to strengthen in Q3"
              value={form.headline}
              onChange={(e) =>
                setForm((p) => ({ ...p, headline: e.target.value }))
              }
            />
          </div>
          <div>
            <Label className="text-foreground mb-1 block">Summary</Label>
            <Textarea
              data-ocid="institutional.summary.textarea"
              className="bg-background border-border resize-none"
              placeholder="Brief analysis summary..."
              rows={3}
              value={form.summary}
              onChange={(e) =>
                setForm((p) => ({ ...p, summary: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground mb-1 block">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
              >
                <SelectTrigger
                  className="bg-background border-border"
                  data-ocid="institutional.currency.select"
                >
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground mb-1 block">Sentiment</Label>
              <Select
                value={form.sentiment}
                onValueChange={(v) => setForm((p) => ({ ...p, sentiment: v }))}
              >
                <SelectTrigger
                  className="bg-background border-border"
                  data-ocid="institutional.sentiment.select"
                >
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Bullish">Bullish</SelectItem>
                  <SelectItem value="Bearish">Bearish</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-foreground mb-1 block">Date</Label>
            <Input
              data-ocid="institutional.date.input"
              type="date"
              className="bg-background border-border"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="institutional.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-teal-text bg-teal hover:bg-teal/90"
            data-ocid="institutional.submit_button"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {submitting ? "Saving..." : "Add News"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InstitutionalPage({ isAdmin }: InstitutionalPageProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const [news, setNews] = useState<InstitutionalNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Filters
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [filterInstitution, setFilterInstitution] = useState("all");
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [search, setSearch] = useState("");

  const fetchNews = useCallback(async () => {
    if (!actor) return;
    try {
      const result = await (actor as any).getInstitutionalNews();
      setNews(result);
    } catch {
      toast.error("Failed to load institutional news");
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || actorFetching) return;
    setLoading(true);
    fetchNews().finally(() => setLoading(false));
  }, [actor, actorFetching, fetchNews]);

  const handleRefresh = async () => {
    if (!actor) return;
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
    toast.success("News refreshed");
  };

  const handleAddNews = async (input: InstitutionalNewsInput) => {
    if (!actor) return;
    try {
      await (actor as any).createInstitutionalNews(input);
      await fetchNews();
      toast.success("News added successfully");
    } catch {
      toast.error("Failed to add news");
      throw new Error("Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!actor) return;
    try {
      await (actor as any).deleteInstitutionalNews(id);
      setNews((prev) => prev.filter((n) => n.id !== id));
      toast.success("News deleted");
    } catch {
      toast.error("Failed to delete news");
    }
  };

  const filtered = useMemo(() => {
    return news.filter((item) => {
      if (filterCurrency !== "all" && item.currency !== filterCurrency)
        return false;
      if (filterInstitution !== "all" && item.institution !== filterInstitution)
        return false;
      if (filterSentiment !== "all" && item.sentiment !== filterSentiment)
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !item.headline.toLowerCase().includes(q) &&
          !item.summary.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [news, filterCurrency, filterInstitution, filterSentiment, search]);

  // Sort newest first
  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [filtered],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-teal" />
            <h1 className="text-2xl font-bold text-foreground">
              Institutional Market Intelligence
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Insights and views from major financial institutions influencing
            currency markets
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-border"
            data-ocid="institutional.refresh.button"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="btn-teal-text bg-teal hover:bg-teal/90"
              data-ocid="institutional.add_news.open_modal_button"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add News
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-ocid="institutional.search_input"
            className="bg-card border-border pl-9"
            placeholder="Search headlines & summaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCurrency} onValueChange={setFilterCurrency}>
          <SelectTrigger
            className="w-[130px] bg-card border-border"
            data-ocid="institutional.filter_currency.select"
          >
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Currencies</SelectItem>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterInstitution} onValueChange={setFilterInstitution}>
          <SelectTrigger
            className="w-[160px] bg-card border-border"
            data-ocid="institutional.filter_institution.select"
          >
            <SelectValue placeholder="Institution" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Institutions</SelectItem>
            {INSTITUTIONS.map((inst) => (
              <SelectItem key={inst} value={inst}>
                {inst}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSentiment} onValueChange={setFilterSentiment}>
          <SelectTrigger
            className="w-[130px] bg-card border-border"
            data-ocid="institutional.filter_sentiment.select"
          >
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Sentiments</SelectItem>
            <SelectItem value="Bullish">Bullish</SelectItem>
            <SelectItem value="Bearish">Bearish</SelectItem>
            <SelectItem value="Neutral">Neutral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted-foreground">
          Showing {sorted.length} of {news.length} news items
          {(filterCurrency !== "all" ||
            filterInstitution !== "all" ||
            filterSentiment !== "all" ||
            search) &&
            " (filtered)"}
        </p>
      )}

      {/* News Grid */}
      {loading ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-ocid="institutional.loading_state"
        >
          {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((k) => (
            <NewsCardSkeleton key={k} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          data-ocid="institutional.empty_state"
          className="flex flex-col items-center justify-center gap-3 py-16 text-center border border-dashed border-border rounded-xl"
        >
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No news found</p>
          <p className="text-xs text-muted-foreground/60">
            {news.length === 0
              ? "No institutional news has been added yet."
              : "Try adjusting your filters or search query."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((item, idx) => {
            const archived = isArchived(item.date);
            const instColor =
              INSTITUTION_COLORS[item.institution] ??
              "bg-muted text-muted-foreground border-border";
            const sentColor =
              SENTIMENT_STYLES[item.sentiment] ??
              "bg-muted text-muted-foreground border-border";
            return (
              <Card
                key={item.id}
                className="bg-card border-border hover:border-teal/40 transition-colors group"
                data-ocid={`institutional.item.${idx + 1}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${instColor}`}
                      >
                        {item.institution}
                      </Badge>
                      {archived && (
                        <Badge
                          variant="outline"
                          className="text-xs border border-muted-foreground/30 text-muted-foreground/60"
                        >
                          <Archive className="h-3 w-3 mr-1" />
                          Archive
                        </Badge>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-trade-loss hover:bg-trade-loss/10 shrink-0"
                        onClick={() => handleDelete(item.id)}
                        data-ocid={`institutional.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 mt-2">
                    {item.headline}
                  </h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                    {item.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <Badge
                        variant="outline"
                        className="text-xs border border-border text-muted-foreground"
                      >
                        {item.currency}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${sentColor}`}
                      >
                        {item.sentiment}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground/60">
                      {item.date}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <AddNewsModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSubmit={handleAddNews}
        />
      )}
    </div>
  );
}
