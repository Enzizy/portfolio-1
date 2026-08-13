export type ThemeOrigin = { x: number; y: number };
export type ThemeName = "light" | "dark";
export type ThemeRequestDetail = { theme: ThemeName; origin?: ThemeOrigin };

export function toggleDocumentTheme(origin?: ThemeOrigin) {
  const root = document.documentElement;
  if (root.dataset.themeTransitioning === "true") return;
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(forced-colors: active)").matches
  ) {
    root.dataset.theme = nextTheme;
    try { localStorage.setItem("portfolio-theme", nextTheme); } catch { /* Keep the current-session theme. */ }
    return;
  }
  window.dispatchEvent(new CustomEvent<ThemeRequestDetail>("portfolio:theme-request", { detail: { theme: nextTheme, origin } }));
}
