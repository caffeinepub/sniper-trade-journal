import AppLayout, { type AppPage } from "@/components/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { ThemeProvider } from "@/hooks/useTheme";
import AdminPage from "@/pages/AdminPage";
import CalendarPage from "@/pages/CalendarPage";
import DashboardPage from "@/pages/DashboardPage";
import DrillJournalPage from "@/pages/DrillJournalPage";
import JournalPage from "@/pages/JournalPage";
import MasteryPage from "@/pages/MasteryPage";
import NewDrillPage from "@/pages/NewDrillPage";
import ReviewPage from "@/pages/ReviewPage";
import SignInPage from "@/pages/SignInPage";
import TradeFormPage from "@/pages/TradeFormPage";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [editTradeId, setEditTradeId] = useState<string | undefined>(undefined);
  const [editDrillId, setEditDrillId] = useState<string | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const { identity, login, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const { actor, isFetching: actorFetching } = useActor();

  // Auto-register user and check admin status after actor is ready
  useEffect(() => {
    if (!isAuthenticated || !actor || actorFetching) {
      if (!isAuthenticated) setIsAdmin(false);
      return;
    }
    // Auto-register: calling with empty string registers as a regular user
    // (or no-ops if already registered). This is safe to call every time.
    (
      actor as unknown as {
        _initializeAccessControlWithSecret: (t: string) => Promise<void>;
      }
    )
      ._initializeAccessControlWithSecret("")
      .catch(() => {
        // ignore registration errors — user may already be registered
      })
      .finally(() => {
        // After registration attempt, check actual admin status
        actor
          .isCallerAdmin()
          .then(setIsAdmin)
          .catch(() => setIsAdmin(false));
      });
  }, [isAuthenticated, actor, actorFetching]);

  const handleNavigate = (page: AppPage, id?: string) => {
    // Guard: non-admin cannot access admin page
    if (page === "admin" && !isAdmin) {
      setCurrentPage("dashboard");
      return;
    }
    setCurrentPage(page);
    if (page === "new-trade") {
      setEditTradeId(id);
      setEditDrillId(undefined);
    } else if (page === "mastery-new-drill") {
      setEditDrillId(id);
      setEditTradeId(undefined);
    } else {
      setEditTradeId(undefined);
      setEditDrillId(undefined);
    }
  };

  // Redirect if on admin page but not admin
  useEffect(() => {
    if (currentPage === "admin" && !isAdmin && isAuthenticated) {
      setCurrentPage("dashboard");
    }
  }, [currentPage, isAdmin, isAuthenticated]);

  // Full-screen loading spinner while auth initializes
  if (isInitializing) {
    return (
      <div
        data-ocid="signin.loading_state"
        className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
      >
        <Loader2 className="w-8 h-8 text-teal animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Loading…</p>
      </div>
    );
  }

  // Sign-in gate — show sign-in page if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <SignInPage login={login} isLoggingIn={isLoggingIn} />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "bg-card border-border text-foreground",
            },
          }}
        />
      </ThemeProvider>
    );
  }

  const refreshAdminStatus = async () => {
    if (!actor) return;
    try {
      const result = await actor.isCallerAdmin();
      setIsAdmin(result);
    } catch {
      // ignore
    }
  };

  // Authenticated app
  return (
    <ThemeProvider>
      <AppLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isAdmin={isAdmin}
        actor={actor}
        onAdminGranted={refreshAdminStatus}
      >
        {currentPage === "dashboard" && <DashboardPage />}
        {currentPage === "journal" && (
          <JournalPage onNavigate={handleNavigate} />
        )}
        {currentPage === "new-trade" && (
          <TradeFormPage
            editTradeId={editTradeId}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === "calendar" && <CalendarPage />}
        {currentPage === "review" && <ReviewPage />}
        {currentPage === "mastery" && (
          <MasteryPage onNavigate={handleNavigate} />
        )}
        {currentPage === "mastery-new-drill" && (
          <NewDrillPage editDrillId={editDrillId} onNavigate={handleNavigate} />
        )}
        {currentPage === "mastery-journal" && (
          <DrillJournalPage onNavigate={handleNavigate} />
        )}
        {currentPage === "admin" && isAdmin && <AdminPage />}

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "bg-card border-border text-foreground",
            },
          }}
        />

        {/* Footer */}
        <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with{" "}
          <span className="text-trade-loss">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </AppLayout>
    </ThemeProvider>
  );
}
