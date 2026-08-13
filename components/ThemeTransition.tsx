"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PixelSwap, PIXEL_SWAP_DURATION } from "@/components/PixelSwap";
import { ThemeName, ThemeRequestDetail } from "@/lib/theme";

type TransitionRequest = ThemeRequestDetail & { viewportWidth: number; viewportHeight: number };

export function ThemeTransition() {
  const [request, setRequest] = useState<TransitionRequest | null>(null);
  const [running, setRunning] = useState(false);
  const requestRef = useRef<TransitionRequest | null>(null);

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const detail = (event as CustomEvent<ThemeRequestDetail>).detail;
      if (!detail || requestRef.current || (detail.theme !== "light" && detail.theme !== "dark")) return;
      const next = { ...detail, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
      requestRef.current = next;
      document.documentElement.dataset.themeTransitioning = "true";
      setRequest(next);
    };
    window.addEventListener("portfolio:theme-request", handleRequest);
    return () => window.removeEventListener("portfolio:theme-request", handleRequest);
  }, []);

  useEffect(() => {
    if (!request) return;
    let secondFrame = 0;
    let finishTimer = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        document.documentElement.dataset.theme = request.theme;
        try { window.localStorage.setItem("portfolio-theme", request.theme); } catch { /* Keep the current-session theme. */ }
        setRunning(true);
        finishTimer = window.setTimeout(() => {
          setRunning(false);
          setRequest(null);
          requestRef.current = null;
          delete document.documentElement.dataset.themeTransitioning;
        }, PIXEL_SWAP_DURATION);
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      if (finishTimer) window.clearTimeout(finishTimer);
    };
  }, [request]);

  if (!request) return null;
  const previousTheme: ThemeName = request.theme === "dark" ? "light" : "dark";

  return createPortal((
    <PixelSwap
      previousTheme={previousTheme}
      running={running}
      origin={request.origin}
      viewportWidth={request.viewportWidth}
      viewportHeight={request.viewportHeight}
    />
  ), document.documentElement);
}
