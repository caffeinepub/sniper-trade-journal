import { Button } from "@/components/ui/button";
import {
  BarChart2,
  Brain,
  ChevronRight,
  Fingerprint,
  Loader2,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface SignInPageProps {
  login: () => void;
  isLoggingIn: boolean;
}

const FEATURES = [
  {
    icon: BarChart2,
    title: "Track Every Trade",
    desc: "Full ICT/SMC structure — entry, SL, TP, RR auto-calc, and grade.",
  },
  {
    icon: Brain,
    title: "Psychology Analytics",
    desc: "Know exactly how fear, FOMO, and calm affect your win rate.",
  },
  {
    icon: TrendingUp,
    title: "Equity Curve + Charts",
    desc: "Real-time P&L curve, R-multiple distribution, session breakdown.",
  },
  {
    icon: ShieldCheck,
    title: "Brutal Review Mode",
    desc: "AI-powered pattern detection that tells you where you're leaking.",
  },
];

const STEPS = [
  {
    num: "01",
    text: 'Click "Sign In with Internet Identity" below.',
  },
  {
    num: "02",
    text: "A secure, encrypted window opens from the Internet Computer.",
  },
  {
    num: "03",
    text: "Follow the prompts — use your device biometrics or passkey to create or log in to your Internet Identity.",
  },
  {
    num: "04",
    text: "You're in. Your trades are permanently tied to your identity, not a password.",
  },
];

export default function SignInPage({ login, isLoggingIn }: SignInPageProps) {
  return (
    <div
      data-ocid="signin.page"
      className="relative min-h-screen bg-background overflow-x-hidden flex flex-col"
    >
      {/* Background grid + glow */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(var(--teal) / 0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 100%, oklch(var(--teal) / 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Header / Logo bar */}
      <header className="relative z-10 flex items-center gap-3 px-6 py-5 border-b border-border/40">
        <div className="w-8 h-8 rounded-md bg-teal flex items-center justify-center shrink-0">
          <Target className="w-4 h-4 text-[oklch(var(--primary-foreground))]" />
        </div>
        <span className="font-semibold text-sm text-foreground tracking-wide">
          Sniper Trade Journal
        </span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg text-center"
        >
          {/* Icon badge */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-teal-muted border border-teal/30 flex items-center justify-center glow-teal">
              <Target className="w-8 h-8 text-teal" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight mb-3">
            Your Trading Edge <span className="text-teal">Starts Here</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
            A precision trade journal built for ICT, SMC, and structure-based
            traders who want to stop guessing and start growing.
          </p>

          {/* Primary CTA */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isLoggingIn ? "logging-in" : "idle"}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                data-ocid="signin.primary_button"
                size="lg"
                className="w-full sm:w-auto sm:px-10 text-base font-semibold h-14 rounded-xl transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "oklch(var(--teal))",
                  color: "#ffffff",
                  boxShadow: "0 0 24px oklch(var(--teal) / 0.45)",
                }}
                onClick={login}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
                    Opening Secure Window…
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2.5 h-5 w-5" />
                    Sign In with Internet Identity
                  </>
                )}
              </Button>
            </motion.div>
          </AnimatePresence>

          {/* No email note */}
          <p className="mt-4 text-xs text-muted-foreground">
            No email. No password. Just your device.
          </p>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl mt-14 grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 sm:px-0"
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
                className="flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-4 card-hover"
              >
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-teal-muted border border-teal/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-snug mb-0.5">
                    {f.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl mt-10 px-4 sm:px-0"
        >
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-5 rounded-full bg-teal" />
              <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
                New here? Here's how it works
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Internet Identity is passwordless authentication built into the
              Internet Computer. It uses your device's biometrics (Touch ID,
              Face ID, Windows Hello) or a passkey. Clicking the button above
              will guide you through creating your account automatically — takes
              about 30 seconds.
            </p>
            <ol className="space-y-3">
              {STEPS.map((step) => (
                <li key={step.num} className="flex items-start gap-4">
                  <span className="font-jetbrains text-[11px] font-bold text-teal shrink-0 w-7 mt-0.5">
                    {step.num}
                  </span>
                  <div className="flex items-start gap-2 flex-1">
                    <ChevronRight className="w-3.5 h-3.5 text-teal/50 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>

        {/* Repeat CTA for long page scrollers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-10 flex flex-col items-center gap-3 px-4"
        >
          <Button
            data-ocid="signin.primary_button"
            size="lg"
            className="w-full sm:w-auto sm:px-10 text-base font-semibold h-14 rounded-xl transition-all duration-200 active:scale-[0.98]"
            style={{
              background: "oklch(var(--teal))",
              color: "#ffffff",
              boxShadow: "0 0 24px oklch(var(--teal) / 0.45)",
            }}
            onClick={login}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
                Opening Secure Window…
              </>
            ) : (
              <>
                <Fingerprint className="mr-2.5 h-5 w-5" />
                Sign In with Internet Identity
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Your trades. Your data. Fully on-chain.
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 px-6 py-4 text-center text-xs text-muted-foreground">
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
    </div>
  );
}
