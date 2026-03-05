import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "dark" | "white";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
});

function applyThemeClass(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("theme-dark", "theme-white");
  root.classList.add(`theme-${t}`);
  // Keep Tailwind dark: variants in sync
  if (t === "white") {
    root.classList.remove("dark");
  } else {
    root.classList.add("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    let saved: Theme = "dark";
    try {
      const raw = localStorage.getItem("sniper-theme") as Theme | null;
      if (raw === "dark" || raw === "white") saved = raw;
      else if (raw === "blue") saved = "dark"; // migrate old blue selection to dark
    } catch {
      // ignore
    }
    // Apply immediately — before first paint — so :root defaults never win
    applyThemeClass(saved);
    return saved;
  });

  const setTheme = (t: Theme) => {
    applyThemeClass(t);
    setThemeState(t);
    try {
      localStorage.setItem("sniper-theme", t);
    } catch {
      // ignore
    }
  };

  // Keep in sync if something external changes the state
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
