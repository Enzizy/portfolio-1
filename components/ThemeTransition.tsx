"use client";

import { useEffect } from "react";
import { createPixelSwap, PIXEL_MASK_PROPERTY, PIXEL_SWAP_DURATION } from "@/components/PixelSwap";
import { ThemeName, ThemeRequestDetail } from "@/lib/theme";

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition: () => void;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => ViewTransition;
};

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem("portfolio-theme", theme);
  } catch {
    // The theme still applies for the current session when storage is unavailable.
  }
}

export function ThemeTransition() {
  useEffect(() => {
    const controller = new AbortController();
    let activeTransition: ViewTransition | null = null;

    const cleanup = () => {
      const root = document.documentElement;
      delete root.dataset.themeTransitioning;
      delete root.dataset.themeTransitionCapture;
      root.style.removeProperty(PIXEL_MASK_PROPERTY);
      root.style.removeProperty("--theme-pixel-duration");
      activeTransition = null;
    };

    const handleRequest = async (event: Event) => {
      const detail = (event as CustomEvent<ThemeRequestDetail>).detail;
      const root = document.documentElement;
      if (!detail || activeTransition || (detail.theme !== "light" && detail.theme !== "dark")) return;

      const viewTransitionDocument = document as ViewTransitionDocument;
      const pixelSwap = createPixelSwap(window.innerWidth, window.innerHeight, detail.origin);
      root.dataset.themeTransitioning = "true";
      root.dataset.themeTransitionCapture = "true";
      root.style.setProperty(PIXEL_MASK_PROPERTY, pixelSwap.initialMask);
      root.style.setProperty("--theme-pixel-duration", `${PIXEL_SWAP_DURATION}ms`);

      if (!viewTransitionDocument.startViewTransition) {
        applyTheme(detail.theme);
        cleanup();
        return;
      }

      try {
        activeTransition = viewTransitionDocument.startViewTransition(() => applyTheme(detail.theme));
        await activeTransition.ready;
        delete root.dataset.themeTransitionCapture;
        await pixelSwap.play(root, controller.signal);
        // The mask is fully open now. End the snapshot explicitly instead of
        // waiting for browser animation bookkeeping that can be restarted by
        // the live mask updates.
        activeTransition.skipTransition();
      } catch {
        activeTransition?.skipTransition();
        applyTheme(detail.theme);
      } finally {
        cleanup();
      }
    };

    window.addEventListener("portfolio:theme-request", handleRequest);
    return () => {
      controller.abort();
      activeTransition?.skipTransition();
      cleanup();
      window.removeEventListener("portfolio:theme-request", handleRequest);
    };
  }, []);

  return null;
}
