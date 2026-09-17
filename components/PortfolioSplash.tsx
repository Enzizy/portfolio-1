"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type FocusRect = { x: number; y: number; width: number; height: number };

const WORDS = ["Zhyronne", "Batican"];
const FOCUS_SWITCH_MS = 720;
const EXIT_START_MS = 1540;
const EXIT_DURATION_MS = 440;

export function PortfolioSplash() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let released = false;
    const releasePage = () => {
      if (released) return;
      released = true;
      root.style.overflow = previousOverflow;
      delete root.dataset.splashActive;
    };

    root.dataset.splashActive = "true";
    root.style.overflow = "hidden";

    if (reducedMotion) {
      setCurrentIndex(1);
      const exitTimer = window.setTimeout(() => setExiting(true), 180);
      const finishTimer = window.setTimeout(() => {
        setVisible(false);
        releasePage();
      }, 320);
      return () => {
        window.clearTimeout(exitTimer);
        window.clearTimeout(finishTimer);
        releasePage();
      };
    }

    const focusTimer = window.setTimeout(() => setCurrentIndex(1), FOCUS_SWITCH_MS);
    const exitTimer = window.setTimeout(() => setExiting(true), EXIT_START_MS);
    const finishTimer = window.setTimeout(() => {
      setVisible(false);
      releasePage();
    }, EXIT_START_MS + EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
      releasePage();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const container = containerRef.current;
    const word = wordRefs.current[currentIndex];
    if (!container || !word) return;

    const measure = () => {
      // Offset coordinates and Framer Motion transforms use the same CSS pixel
      // space, including when desktop zoom is applied to the page.
      setFocusRect({
        x: word.offsetLeft,
        y: word.offsetTop,
        width: word.offsetWidth,
        height: word.offsetHeight,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(word);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => observer.disconnect();
  }, [currentIndex, visible]);

  if (!visible) return null;

  return (
    <motion.div
      className="portfolio-splash"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: EXIT_DURATION_MS / 1000, ease: [0.65, 0, 0.35, 1] }}
      role="status"
      aria-label="Loading Zhyronne Batican portfolio"
    >
      <div className="portfolio-splash__meta" aria-hidden="true">
        <span>ZB.</span>
        <span>PORTFOLIO / 2026</span>
      </div>

      <motion.div
        className="portfolio-splash__stage"
        animate={{ y: exiting ? -14 : 0, scale: exiting ? 1.025 : 1 }}
        transition={{ duration: EXIT_DURATION_MS / 1000, ease: [0.65, 0, 0.35, 1] }}
        aria-hidden="true"
      >
        <div className="portfolio-splash__focus" ref={containerRef}>
          {WORDS.map((word, index) => (
            <motion.span
              key={word}
              ref={(element) => { wordRefs.current[index] = element; }}
              className="portfolio-splash__word"
              animate={{
                filter: index === currentIndex ? "blur(0px)" : "blur(7px)",
                opacity: index === currentIndex ? 1 : 0.42,
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          ))}

          <motion.div
            className="portfolio-splash__frame"
            animate={{
              x: focusRect.x,
              y: focusRect.y,
              width: focusRect.width,
              height: focusRect.height,
              opacity: focusRect.width ? 1 : 0,
            }}
            transition={{ duration: currentIndex === 0 ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="portfolio-splash__corner portfolio-splash__corner--tl" />
            <span className="portfolio-splash__corner portfolio-splash__corner--tr" />
            <span className="portfolio-splash__corner portfolio-splash__corner--br" />
            <span className="portfolio-splash__corner portfolio-splash__corner--bl" />
          </motion.div>
        </div>
      </motion.div>

      <div className="portfolio-splash__progress" aria-hidden="true"><span /></div>
    </motion.div>
  );
}
