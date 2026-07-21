"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toggleDocumentTheme } from "@/lib/theme";

export function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.dataset.theme === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    toggleDocumentTheme(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined);
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
