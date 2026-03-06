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
import RiskCalculatorPage from "@/pages/RiskCalculatorPage";
import SignInPage from "@/pages/SignInPage";
import TradeFormPage from "@/pages/TradeFormPage";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [editTradeId, setEditTradeId] = useState<string | undefined>(undefined);
  const [editDrillId, setEditDrillId] = useState<string | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  // null = unknown (still loading), false = no admin yet, true = admin exists
  const [adminAssigned, setAdminAssigned] = useState<boolean | null>(null);
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

    // Check if any admin is already assigned (to control Claim Admin button visibility)
    actor
      .isAdminAssigned()
      .then(async (assigned) => {
        setAdminAssigned(assigned);

        if (assigned) {
          // Admin already exists — safe to auto-register as a regular user.
          // This is a no-op if the caller is already registered.
          try {
            await (
              actor as unknown as {
                _initializeAccessControlWithSecret: (
                  t: string,
                ) => Promise<void>;
              }
            )._initializeAccessControlWithSecret("");
          } catch {
            // ignore — already registered
          }
        }
        // If admin not yet assigned, do NOT auto-register — the owner must
        // explicitly click "Claim Admin" so they become admin, not a user.

        // Always refresh admin status after the above
        actor
          .isCallerAdmin()
          .then(setIsAdmin)
          .catch(() => setIsAdmin(false));
      })
      .catch(() => {
        setAdminAssigned(false);
        setIsAdmin(false);
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
      const [adminResult, assignedResult] = await Promise.all([
        actor.isCallerAdmin(),
        actor.isAdminAssigned(),
      ]);
      setIsAdmin(adminResult);
      setAdminAssigned(assignedResult);
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
        adminAlreadyAssigned={adminAssigned}
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
        {currentPage === "risk-calculator" && <RiskCalculatorPage />}

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
