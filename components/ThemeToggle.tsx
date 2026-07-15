"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextTheme = isDark ? "light" : "dark";
    const rect = buttonRef.current?.getBoundingClientRect();
    root.style.setProperty("--theme-x", `${rect ? rect.left + rect.width / 2 : window.innerWidth / 2}px`);
    root.style.setProperty("--theme-y", `${rect ? rect.top + rect.height / 2 : 32}px`);

    const applyTheme = () => {
      root.dataset.theme = nextTheme;
      localStorage.setItem("portfolio-theme", nextTheme);
      setIsDark(nextTheme === "dark");
    };
    const viewTransitionDocument = document as ViewTransitionDocument;
    root.dataset.themeTransitioning = "true";

    if (viewTransitionDocument.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const transition = viewTransitionDocument.startViewTransition(applyTheme);
      void transition.finished.finally(() => delete root.dataset.themeTransitioning);
      return;
    }

    applyTheme();
    window.setTimeout(() => delete root.dataset.themeTransitioning, 650);
  };

  return (
    <button
      ref={buttonRef}
      className={`theme-toggle ${mobile ? "theme-toggle--mobile" : ""}`}
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">{isDark ? <Sun /> : <Moon />}</span>
      {mobile && <span>{isDark ? "/LIGHT MODE" : "/DARK MODE"}</span>}
    </button>
  );
}
