import AppLayout, { type AppPage } from "@/components/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import CalendarPage from "@/pages/CalendarPage";
import DashboardPage from "@/pages/DashboardPage";
import JournalPage from "@/pages/JournalPage";
import ReviewPage from "@/pages/ReviewPage";
import TradeFormPage from "@/pages/TradeFormPage";
import { useState } from "react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [editTradeId, setEditTradeId] = useState<string | undefined>(undefined);

  const handleNavigate = (page: AppPage, tradeId?: string) => {
    setCurrentPage(page);
    if (page === "new-trade") {
      setEditTradeId(tradeId);
    } else {
      setEditTradeId(undefined);
    }
  };

  return (
    <AppLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {currentPage === "dashboard" && <DashboardPage />}
      {currentPage === "journal" && <JournalPage onNavigate={handleNavigate} />}
      {currentPage === "new-trade" && (
        <TradeFormPage editTradeId={editTradeId} onNavigate={handleNavigate} />
      )}
      {currentPage === "calendar" && <CalendarPage />}
      {currentPage === "review" && <ReviewPage />}

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
  );
}
