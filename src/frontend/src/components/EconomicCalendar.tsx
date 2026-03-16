import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";

interface CalendarEvent {
  id: string;
  time: string;
  name: string;
  flag: string;
  country: string;
  importance: "High" | "Medium" | "Low";
  description: string;
  date: Date;
}

// Today is March 16, 2026 (Monday)
// Generate events for next 30 days
function buildEvents(): CalendarEvent[] {
  const today = new Date(2026, 2, 16); // March 16, 2026

  const events: CalendarEvent[] = [
    // TODAY — March 16
    {
      id: "e1",
      date: new Date(2026, 2, 16),
      time: "08:30 ET",
      name: "Retail Sales (Feb)",
      flag: "🇺🇸",
      country: "US",
      importance: "Medium",
      description:
        "US consumer spending data. Strong retail sales support USD and risk-on.",
    },
    {
      id: "e2",
      date: new Date(2026, 2, 16),
      time: "10:00 ET",
      name: "Fed Governor Speech",
      flag: "🇺🇸",
      country: "US",
      importance: "Medium",
      description:
        "Federal Reserve governor remarks on monetary policy outlook.",
    },
    // THIS WEEK — March 17-22
    {
      id: "e3",
      date: new Date(2026, 2, 17),
      time: "08:30 ET",
      name: "Building Permits / Housing Starts",
      flag: "🇺🇸",
      country: "US",
      importance: "Low",
      description:
        "Housing market leading indicators. Affects rate expectations.",
    },
    {
      id: "e4",
      date: new Date(2026, 2, 18),
      time: "10:30 ET",
      name: "EIA Oil Inventories",
      flag: "🇺🇸",
      country: "US",
      importance: "Medium",
      description:
        "Weekly crude oil inventory data. Large builds are bearish for oil; large draws are bullish.",
    },
    {
      id: "e5",
      date: new Date(2026, 2, 18),
      time: "All Day",
      name: "FOMC Meeting Day 1",
      flag: "🇺🇸",
      country: "US",
      importance: "High",
      description:
        "First day of the two-day Federal Open Market Committee policy meeting.",
    },
    {
      id: "e6",
      date: new Date(2026, 2, 19),
      time: "14:00 ET",
      name: "FOMC Rate Decision + Press Conference",
      flag: "🇺🇸",
      country: "US",
      importance: "High",
      description:
        "Fed announces rate decision. Powell press conference follows. Highest-impact USD event.",
    },
    {
      id: "e7",
      date: new Date(2026, 2, 20),
      time: "07:00 ET",
      name: "BoE Interest Rate Decision",
      flag: "🇬🇧",
      country: "UK",
      importance: "High",
      description:
        "Bank of England monetary policy decision. Key GBP volatility event.",
    },
    {
      id: "e8",
      date: new Date(2026, 2, 20),
      time: "08:30 ET",
      name: "US Initial Jobless Claims",
      flag: "🇺🇸",
      country: "US",
      importance: "Low",
      description:
        "Weekly unemployment claims. Leading labor market indicator.",
    },
    {
      id: "e9",
      date: new Date(2026, 2, 21),
      time: "08:30 ET",
      name: "Canada CPI (Feb)",
      flag: "🇨🇦",
      country: "CA",
      importance: "Medium",
      description:
        "Canadian inflation data. Affects BoC policy expectations and CAD.",
    },
    {
      id: "e10",
      date: new Date(2026, 2, 21),
      time: "10:30 ET",
      name: "ECB President Lagarde Speech",
      flag: "🇪🇺",
      country: "EU",
      importance: "High",
      description:
        "ECB President speaking on eurozone economic outlook and rate path.",
    },
    // NEXT WEEK — March 23-29
    {
      id: "e11",
      date: new Date(2026, 2, 24),
      time: "09:45 ET",
      name: "US S&P PMI Flash (March)",
      flag: "🇺🇸",
      country: "US",
      importance: "Medium",
      description:
        "Preliminary manufacturing and services PMI. Gauge of economic expansion.",
    },
    {
      id: "e12",
      date: new Date(2026, 2, 25),
      time: "10:30 ET",
      name: "EIA Oil Inventories",
      flag: "🇺🇸",
      country: "US",
      importance: "Medium",
      description: "Weekly crude oil inventory data.",
    },
    {
      id: "e13",
      date: new Date(2026, 2, 26),
      time: "08:30 ET",
      name: "US GDP (Q4 Final Revision)",
      flag: "🇺🇸",
      country: "US",
      importance: "Medium",
      description: "Final Q4 2025 GDP print. Confirms pace of economic growth.",
    },
    {
      id: "e14",
      date: new Date(2026, 2, 26),
      time: "08:30 ET",
      name: "BoJ Summary of Opinions",
      flag: "🇯🇵",
      country: "JP",
      importance: "Medium",
      description:
        "Bank of Japan meeting summary. Key for JPY direction and rate expectations.",
    },
    {
      id: "e15",
      date: new Date(2026, 2, 27),
      time: "08:30 ET",
      name: "US Personal Income & PCE Deflator (Feb)",
      flag: "🇺🇸",
      country: "US",
      importance: "High",
      description:
        "Fed's preferred inflation gauge. Core PCE is critical for rate trajectory.",
    },
    {
      id: "e16",
      date: new Date(2026, 2, 28),
      time: "All Day",
      name: "Good Friday — Partial Market Closure",
      flag: "🌍",
      country: "Global",
      importance: "Low",
      description:
        "Many markets closed or partially closed. Expect lower liquidity.",
    },
    // LATER THIS MONTH
    {
      id: "e17",
      date: new Date(2026, 3, 1),
      time: "10:30 ET",
      name: "EIA Oil Inventories",
      flag: "🇺🇸",
      country: "US",
      importance: "Medium",
      description: "Weekly crude oil inventory data.",
    },
    {
      id: "e18",
      date: new Date(2026, 3, 2),
      time: "08:30 ET",
      name: "US Non-Farm Payrolls (Mar)",
      flag: "🇺🇸",
      country: "US",
      importance: "High",
      description:
        "NFP is the most market-moving monthly release. Beats → USD Bullish; Misses → USD Bearish.",
    },
    {
      id: "e19",
      date: new Date(2026, 3, 2),
      time: "08:30 ET",
      name: "Canada Employment Change",
      flag: "🇨🇦",
      country: "CA",
      importance: "Medium",
      description: "Canadian labor market report released alongside US NFP.",
    },
    {
      id: "e20",
      date: new Date(2026, 3, 7),
      time: "02:00 ET",
      name: "UK GDP Monthly Estimate",
      flag: "🇬🇧",
      country: "UK",
      importance: "Medium",
      description:
        "Monthly UK growth data. Key for BoE rate expectations and GBP.",
    },
    {
      id: "e21",
      date: new Date(2026, 3, 9),
      time: "08:30 ET",
      name: "US CPI (March)",
      flag: "🇺🇸",
      country: "US",
      importance: "High",
      description:
        "Consumer Price Index. Highest-impact monthly inflation print for USD and rates.",
    },
    {
      id: "e22",
      date: new Date(2026, 3, 10),
      time: "08:30 ET",
      name: "US PPI (March)",
      flag: "🇺🇸",
      country: "US",
      importance: "Medium",
      description:
        "Producer Price Index. Leading indicator for consumer inflation.",
    },
    {
      id: "e23",
      date: new Date(2026, 3, 14),
      time: "07:15 ET",
      name: "ECB Interest Rate Decision",
      flag: "🇪🇺",
      country: "EU",
      importance: "High",
      description:
        "ECB monetary policy decision. Key EUR volatility event and rate path indicator.",
    },
    {
      id: "e24",
      date: new Date(2026, 3, 16),
      time: "08:30 ET",
      name: "US Retail Sales (March)",
      flag: "🇺🇸",
      country: "US",
      importance: "Medium",
      description: "Monthly consumer spending data.",
    },
  ];

  return events.filter((e) => {
    const diff = e.date.getTime() - today.getTime();
    return diff >= 0;
  });
}

const ALL_EVENTS = buildEvents();

const IMPORTANCE_STYLES: Record<string, string> = {
  High: "bg-red-500/15 text-red-400 border-red-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Low: "bg-muted text-muted-foreground border-border",
};

function groupEvents(events: CalendarEvent[]) {
  const today = new Date(2026, 2, 16);
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfWeek.getDate() + 7);

  const todayEvents: CalendarEvent[] = [];
  const thisWeekEvents: CalendarEvent[] = [];
  const nextWeekEvents: CalendarEvent[] = [];
  const laterEvents: CalendarEvent[] = [];

  for (const e of events) {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) {
      todayEvents.push(e);
    } else if (d <= endOfWeek) {
      thisWeekEvents.push(e);
    } else if (d <= endOfNextWeek) {
      nextWeekEvents.push(e);
    } else {
      laterEvents.push(e);
    }
  }

  return { todayEvents, thisWeekEvents, nextWeekEvents, laterEvents };
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="flex-shrink-0 w-16 text-right">
        <span className="text-xs font-mono text-muted-foreground">
          {event.time}
        </span>
      </div>
      <div className="text-lg flex-shrink-0 mt-0.5">{event.flag}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">
            {event.name}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${IMPORTANCE_STYLES[event.importance]}`}
          >
            {event.importance}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {event.description}
        </p>
      </div>
    </div>
  );
}

function EventSection({
  title,
  events,
  defaultOpen = true,
}: {
  title: string;
  events: CalendarEvent[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (events.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex items-center justify-between w-full px-1 py-2 group"
        data-ocid={`calendar.${title.toLowerCase().replace(/\s+/g, "_")}.toggle`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
            {events.length}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-2">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function EconomicCalendar() {
  const { todayEvents, thisWeekEvents, nextWeekEvents, laterEvents } =
    groupEvents(ALL_EVENTS);

  const highCount = ALL_EVENTS.filter((e) => e.importance === "High").length;

  return (
    <Card className="bg-card border-border" data-ocid="calendar.panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal" />
            <CardTitle className="text-base font-bold text-foreground">
              Economic Calendar
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Next 30 days</span>
            <Badge
              variant="outline"
              className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30"
            >
              {highCount} High Impact
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {["High", "Medium", "Low"].map((level) => (
            <div key={level} className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  level === "High"
                    ? "bg-red-400"
                    : level === "Medium"
                      ? "bg-amber-400"
                      : "bg-muted-foreground"
                }`}
              />
              <span className="text-[10px] text-muted-foreground">{level}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-0" data-ocid="calendar.list">
        <EventSection title="Today" events={todayEvents} defaultOpen={true} />
        <EventSection
          title="This Week"
          events={thisWeekEvents}
          defaultOpen={true}
        />
        <EventSection
          title="Next Week"
          events={nextWeekEvents}
          defaultOpen={false}
        />
        <EventSection
          title="Later This Month"
          events={laterEvents}
          defaultOpen={false}
        />
      </CardContent>
    </Card>
  );
}
