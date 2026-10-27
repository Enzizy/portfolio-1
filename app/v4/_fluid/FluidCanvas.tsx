"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's living ink. Loads the solver after first paint; if WebGL2 or float
 * render targets are missing, the canvas is marked and CSS shows a still gradient.
 */
export function FluidCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let dispose: (() => void) | null = null;

    import("./fluid").then(({ createFluid }) => {
      if (disposed) return;
      const fluid = createFluid({
        canvas,
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        // Deep ink, with cobalt, periwinkle and ice light moving through it.
        background: [0.006, 0.007, 0.016],
        palette: [
          [0.06, 0.11, 0.85],
          [0.22, 0.15, 0.8],
          [0.06, 0.32, 0.78],
          [0.14, 0.07, 0.6],
          [0.42, 0.46, 0.8],
        ],
      });
      if (!fluid) {
        canvas.dataset.fallback = "true";
        return;
      }
      canvas.dataset.ready = "true";
      dispose = fluid.dispose;
    });

    return () => {
      disposed = true;
      dispose?.();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
