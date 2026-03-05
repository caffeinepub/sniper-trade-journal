import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Brain,
  Calendar,
  ChevronRight,
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
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { backendInterface } from "../backend.d";

export type AppPage =
  | "dashboard"
  | "journal"
  | "new-trade"
  | "calendar"
  | "review"
  | "mastery"
  | "mastery-new-drill"
  | "mastery-journal"
  | "admin";

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
];

interface AppLayoutProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage, id?: string) => void;
  children: React.ReactNode;
  isAdmin?: boolean;
  actor?: backendInterface | null;
  onAdminGranted?: () => Promise<void>;
}

const THEME_OPTIONS = [
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "white" as const, label: "White", icon: Sun },
] as const;

/**
 * Hidden admin setup modal — only opens when URL hash is #admin-setup.
 * Never shown in the regular UI; invisible to normal users.
 */
function HiddenAdminSetupModal({
  actor,
  onAdminGranted,
}: {
  actor: backendInterface | null | undefined;
  onAdminGranted?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  // Watch for #admin-setup in the URL hash
  useEffect(() => {
    const check = () => {
      if (window.location.hash === "#admin-setup") {
        setOpen(true);
        setStatus("idle");
        setToken("");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  const handleClose = () => {
    setOpen(false);
    // Remove the hash without causing a page scroll
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  };

  const handleClaim = async () => {
    if (!actor || !token.trim()) return;
    setLoading(true);
    setStatus("idle");
    try {
      await (
        actor as unknown as {
          _initializeAccessControlWithSecret: (t: string) => Promise<void>;
        }
      )._initializeAccessControlWithSecret(token.trim());
      const isNowAdmin = await actor.isCallerAdmin();
      if (isNowAdmin) {
        setStatus("success");
        setToken("");
        if (onAdminGranted) await onAdminGranted();
        // Auto-close after short delay
        setTimeout(handleClose, 1500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground">
              Admin Setup
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === "success" ? (
          <div className="py-4 text-center space-y-2">
            <Shield className="w-8 h-8 text-teal mx-auto" />
            <p className="text-sm font-semibold text-teal">
              Admin access granted!
            </p>
            <p className="text-xs text-muted-foreground">
              The Admin Panel is now visible in your sidebar.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your admin token to activate the Admin Panel for this
              account.
            </p>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="password"
                placeholder="Admin token…"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setStatus("idle");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleClaim();
                }}
                className="flex-1 text-sm bg-background border-border"
                data-ocid="admin.claim.input"
              />
              <Button
                type="button"
                disabled={loading || !token.trim()}
                onClick={handleClaim}
                className="bg-teal hover:bg-teal/90 text-white btn-teal-text px-4"
                data-ocid="admin.claim.button"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Activate"
                )}
              </Button>
            </div>
            {status === "error" && (
              <p
                className="text-xs text-red-400"
                data-ocid="admin.claim.error_state"
              >
                Invalid token. Please try again.
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default function AppLayout({
  currentPage,
  onNavigate,
  children,
  isAdmin = false,
  actor,
  onAdminGranted,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const { theme, setTheme } = useTheme();

  const handleNav = (page: AppPage) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  /** Shared auth panel content (reused in both desktop sidebar and mobile drawer) */
  const AuthPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("space-y-3", isMobile ? "" : "")}>
      <div className="px-3 py-2 rounded-md bg-sidebar-accent">
        <p className="text-[11px] text-muted-foreground">Signed in</p>
        <p className="text-xs font-mono text-teal truncate">
          {identity?.getPrincipal().toString().slice(0, 20)}...
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
          <img
            src="/assets/generated/sniper-trade-journal-logo-transparent.dim_256x256.png"
            alt="Sniper Trade Journal logo"
            className="w-9 h-9 rounded-md object-cover shrink-0"
          />
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
              className="w-full bg-teal hover:bg-teal/90 text-white btn-teal-text text-xs"
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
          <img
            src="/assets/generated/sniper-trade-journal-logo-transparent.dim_256x256.png"
            alt="Sniper Trade Journal logo"
            className="w-7 h-7 rounded-md object-cover shrink-0"
          />
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
                <img
                  src="/assets/generated/sniper-trade-journal-logo-transparent.dim_256x256.png"
                  alt="Sniper Trade Journal logo"
                  className="w-7 h-7 rounded-md object-cover shrink-0"
                />
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
                  className="w-full bg-teal hover:bg-teal/90 text-white btn-teal-text text-xs"
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

      {/* Hidden admin setup — only triggers via #admin-setup URL hash */}
      <HiddenAdminSetupModal actor={actor} onAdminGranted={onAdminGranted} />
    </div>
  );
}
