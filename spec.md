# Sniper Trade Journal

## Current State
The app is a full-stack trading journal with Dashboard, Journal, New Trade, Calendar, Brutal Review, and Mastery sections. It uses a hardcoded dark trading dashboard theme (deep navy/black with electric teal accents) defined via OKLCH CSS custom properties in `src/frontend/src/index.css`. The `AppLayout.tsx` sidebar has an auth section at the bottom with sign-in/sign-out but no profile or theme controls.

## Requested Changes (Diff)

### Add
- A `ThemeContext` (React context + provider) that stores the active theme (`"dark"` | `"blue"` | `"white"`) in `localStorage` for persistence across reloads.
- Three CSS theme classes on `<html>`:
  - `theme-dark` — current dark navy/teal dashboard style (default)
  - `theme-blue` — deep navy-blue variant (slightly more saturated blue tones, blue sidebar, blue primary accent)
  - `theme-white` — light/white theme (white/light-gray backgrounds, dark text, teal accent preserved)
- A `ProfilePanel` component (or inline section in `AppLayout.tsx` sidebar) that shows:
  - "Profile" label with user principal (truncated, already shown)
  - Three theme picker buttons labeled "Dark", "Blue", "White" — each a small swatch/button; active theme is highlighted
  - data-ocid markers on all interactive elements
- Theme CSS variables in `src/frontend/src/index.css` for all three themes.

### Modify
- `AppLayout.tsx`: Replace the simple "Logged in" + principal display with a richer profile section that includes the theme selector. Also apply the selected theme class to the root element.
- `src/frontend/src/index.css`: Add `.theme-blue` and `.theme-white` CSS variable blocks alongside the existing `:root` (dark) theme. The existing `:root` dark variables remain as the default; `.theme-dark` mirrors them explicitly for clarity.
- `App.tsx`: Wrap the app in `ThemeProvider` and apply the active theme class to `<html>`.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `ThemeContext.tsx` in `src/frontend/src/hooks/` or `src/frontend/src/config/` — exports `useTheme`, `ThemeProvider`, theme type.
2. Add `.theme-dark`, `.theme-blue`, `.theme-white` CSS variable blocks to `src/frontend/src/index.css`.
3. Update `App.tsx` to wrap with `ThemeProvider` and apply theme class to `document.documentElement`.
4. Update `AppLayout.tsx` sidebar profile area to include a theme picker with three buttons (Dark / Blue / White), using `useTheme()`.
5. Add `data-ocid` markers to all new interactive elements.
6. Validate: typecheck, lint, build pass.
