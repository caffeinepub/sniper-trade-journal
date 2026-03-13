import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useTealButtonTextClass } from "@/hooks/useTealButton";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Brain,
  Building2,
  Calculator,
  Calendar,
  ChevronRight,
  Dices,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Plus,
  Shield,
  Sun,
  Swords,
  X,
} from "lucide-react";
import { useState } from "react";
import type { backendInterface } from "../backend";
import { BrandLogo } from "./BrandLogo";

export type AppPage =
  | "dashboard"
  | "journal"
  | "new-trade"
  | "calendar"
  | "review"
  | "mastery"
  | "mastery-new-drill"
  | "mastery-journal"
  | "admin"
  | "risk-calculator"
  | "monte-carlo"
  | "institutional";

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.FC<{ className?: string }>;
  ocid: string;
  activeFor?: AppPage[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  { id: "journal", label: "Journal", icon: BookOpen, ocid: "nav.journal.link" },
  {
    id: "new-trade",
    label: "New Trade",
    icon: Plus,
    ocid: "nav.new_trade.link",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    ocid: "nav.calendar.link",
  },
  {
    id: "review",
    label: "Brutal Review",
    icon: Brain,
    ocid: "nav.review.link",
  },
  {
    id: "mastery",
    label: "Mastery",
    icon: Swords,
    ocid: "nav.mastery.link",
    activeFor: ["mastery", "mastery-new-drill", "mastery-journal"],
  },
  {
    id: "risk-calculator",
    label: "Risk Calculator",
    icon: Calculator,
    ocid: "nav.risk_calculator.link",
  },
  {
    id: "monte-carlo",
    label: "Monte Carlo",
    icon: Dices,
    ocid: "nav.monte_carlo.link",
  },
  {
    id: "institutional",
    label: "Intelligence",
    icon: Building2,
    ocid: "nav.institutional.link",
  },
];

interface AppLayoutProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage, id?: string) => void;
  children: React.ReactNode;
  isAdmin?: boolean;
  actor?: backendInterface | null;
  onAdminGranted?: () => Promise<void>;
  adminAlreadyAssigned?: boolean | null;
}

const THEME_OPTIONS = [
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "white" as const, label: "White", icon: Sun },
] as const;

/**
 * Inline "Claim Admin" section shown inside the sidebar auth panel.
 * Visible only to authenticated non-admin users when no admin has been
 * assigned yet. The first person to click "Claim Admin" becomes the
 * permanent admin — no token required.
 */
function ClaimAdminSection({
  actor,
  onAdminGranted,
  adminAlreadyAssigned,
}: {
  actor: backendInterface | null | undefined;
  onAdminGranted?: () => Promise<void>;
  adminAlreadyAssigned?: boolean | null;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleClaim = async () => {
    if (!actor) return;
    setLoading(true);
    setStatus("idle");
    try {
      // Pass empty string — backend no longer requires a token.
      // First authenticated caller always wins admin.
      await (
        actor as unknown as {
          _initializeAccessControlWithSecret: (t: string) => Promise<void>;
        }
      )._initializeAccessControlWithSecret("");
      const isNowAdmin = await actor.isCallerAdmin();
      if (isNowAdmin) {
        setStatus("success");
        if (onAdminGranted) await onAdminGranted();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // Hide if admin already exists or status unknown (still loading)
  if (adminAlreadyAssigned !== false) return null;

  if (status === "success") {
    return (
      <div className="px-3 py-2 rounded-md bg-teal/10 border border-teal/20 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-teal shrink-0" />
        <p className="text-[11px] text-teal font-semibold">
          Admin access granted!
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-1.5">
        <p
          className="text-[10px] text-red-400 px-1"
          data-ocid="admin.claim.error_state"
        >
          Admin was already claimed by another account.
        </p>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={loading}
      onClick={handleClaim}
      className="w-full h-7 text-[11px] bg-amber-500 hover:bg-amber-500/90 text-white font-semibold"
      data-ocid="admin.claim.button"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin mr-1" />
      ) : (
        <Shield className="w-3 h-3 mr-1" />
      )}
      {loading ? "Claiming…" : "Claim Admin (First Time Only)"}
    </Button>
  );
}

export default function AppLayout({
  currentPage,
  onNavigate,
  children,
  isAdmin = false,
  actor,
  onAdminGranted,
  adminAlreadyAssigned = null,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const { theme, setTheme } = useTheme();
  const tealTextClass = useTealButtonTextClass();

  const handleNav = (page: AppPage) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  /** Shared auth panel content (reused in both desktop sidebar and mobile drawer) */
  const AuthPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("space-y-3", isMobile ? "" : "")}>
      <div className="px-3 py-2 rounded-md bg-sidebar-accent">
        <p className="text-[11px] text-muted-foreground">Signed in as</p>
        <p className="text-xs font-mono text-teal truncate">
          {identity?.getPrincipal().toString().slice(0, 22)}…
        </p>
      </div>

      {/* Theme selector */}
      <div className="px-1">
        <p className="text-[11px] text-muted-foreground px-2 mb-1.5 flex items-center gap-1">
          <Moon className="w-3 h-3" />
          Theme
        </p>
        <div className="flex gap-1" data-ocid="profile.theme.panel">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-ocid={`profile.theme_${opt.value}.button`}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex-1 py-1.5 rounded text-[11px] font-semibold capitalize transition-all duration-150 border",
                theme === opt.value
                  ? "bg-teal border-teal shadow-sm ring-1 ring-teal/50"
                  : "bg-transparent border-sidebar-border text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
              style={theme === opt.value ? { color: "#fff" } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Claim Admin — only visible to the very first user (when no admin has ever been assigned).
          Hidden while still loading (null) and hidden once any admin exists (true). */}
      {!isAdmin && adminAlreadyAssigned === false && (
        <ClaimAdminSection
          actor={actor}
          onAdminGranted={onAdminGranted}
          adminAlreadyAssigned={adminAlreadyAssigned}
        />
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs border-sidebar-border"
        onClick={clear}
        data-ocid="profile.signout.button"
      >
        <LogOut className="w-3 h-3 mr-2" />
        Sign Out
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border">
          <BrandLogo className="w-9 h-9 rounded-md object-cover shrink-0" />
          <div>
            <p className="font-semibold text-sm text-sidebar-foreground leading-tight">
              Sniper Trade
            </p>
            <p className="text-[11px] text-muted-foreground">Journal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.activeFor
              ? item.activeFor.includes(currentPage)
              : currentPage === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={item.ocid}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-teal-muted text-teal border border-teal/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {active && (
                  <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
                )}
              </button>
            );
          })}
          {isAdmin && (
            <button
              type="button"
              data-ocid="nav.admin.link"
              onClick={() => handleNav("admin")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 mt-2 border",
                currentPage === "admin"
                  ? "bg-teal-muted text-teal border-teal/30"
                  : "text-amber-400 border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10 hover:border-amber-400/30",
              )}
            >
              <Shield className="w-4 h-4 shrink-0" />
              Admin Panel
              {currentPage === "admin" && (
                <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
              )}
            </button>
          )}
        </nav>

        {/* Auth */}
        <div className="px-3 pb-5 border-t border-sidebar-border pt-4">
          {isAuthenticated ? (
            <AuthPanel />
          ) : (
            <Button
              size="sm"
              className={`w-full bg-teal hover:bg-teal/90 ${tealTextClass} text-xs`}
              onClick={login}
              disabled={isLoggingIn || isInitializing}
            >
              <LogIn className="w-3 h-3 mr-2" />
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <BrandLogo className="w-7 h-7 rounded-md object-cover shrink-0" />
          <span className="font-semibold text-sm text-sidebar-foreground">
            Sniper Trade Journal
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60 w-full"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-sidebar border-r border-sidebar-border flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <BrandLogo className="w-7 h-7 rounded-md object-cover shrink-0" />
                <span className="font-semibold text-sm">
                  Sniper Trade Journal
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.activeFor
                  ? item.activeFor.includes(currentPage)
                  : currentPage === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    data-ocid={item.ocid}
                    onClick={() => handleNav(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                      active
                        ? "bg-teal-muted text-teal border border-teal/30"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
              {isAdmin && (
                <button
                  type="button"
                  data-ocid="nav.admin.link"
                  onClick={() => handleNav("admin")}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all mt-2 border",
                    currentPage === "admin"
                      ? "bg-teal-muted text-teal border-teal/30"
                      : "text-amber-400 border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10",
                  )}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  Admin Panel
                </button>
              )}
            </nav>
            <div className="px-3 pb-5 border-t border-sidebar-border pt-4">
              {isAuthenticated ? (
                <AuthPanel isMobile />
              ) : (
                <Button
                  size="sm"
                  className={`w-full bg-teal hover:bg-teal/90 ${tealTextClass} text-xs`}
                  onClick={login}
                  disabled={isLoggingIn}
                >
                  <LogIn className="w-3 h-3 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-14">{children}</main>
    </div>
  );
}
