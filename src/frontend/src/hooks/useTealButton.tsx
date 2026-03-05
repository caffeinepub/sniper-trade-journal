import { useTheme } from "./useTheme";

/**
 * Returns a className string for the text color of a teal-background button.
 * - Dark theme: white text (light on dark)
 * - White/light theme: near-black text (dark on light teal)
 *
 * This hook-based approach is more reliable than CSS because it injects the
 * class directly, avoiding all CSS specificity and !important wars.
 */
export function useTealButtonTextClass(): string {
  const { theme } = useTheme();
  return theme === "white" ? "text-gray-900" : "text-white";
}
