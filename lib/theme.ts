export type ThemeOrigin = { x: number; y: number };

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export function toggleDocumentTheme(origin?: ThemeOrigin) {
  const root = document.documentElement;
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.style.setProperty("--theme-x", `${origin?.x ?? window.innerWidth / 2}px`);
  root.style.setProperty("--theme-y", `${origin?.y ?? 32}px`);

  const applyTheme = () => {
    root.dataset.theme = nextTheme;
    localStorage.setItem("portfolio-theme", nextTheme);
  };

  root.dataset.themeTransitioning = "true";
  const viewTransitionDocument = document as ViewTransitionDocument;
  if (viewTransitionDocument.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const transition = viewTransitionDocument.startViewTransition(applyTheme);
    void transition.finished.finally(() => delete root.dataset.themeTransitioning);
    return;
  }

  applyTheme();
  window.setTimeout(() => delete root.dataset.themeTransitioning, 650);
}
