"use client";

import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type TargetCursorProps = {
  targetSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
  parallaxOn?: boolean;
  cursorColor?: string;
  cursorColorOnTarget?: string;
};

type Point = { x: number; y: number };

const TEXT_SELECTOR = [
  "input:not([type])",
  'input[type="text"]',
  'input[type="email"]',
  'input[type="search"]',
  'input[type="url"]',
  'input[type="tel"]',
  'input[type="password"]',
  'input[type="number"]',
  "textarea",
  '[contenteditable="true"]',
].join(",");

const RESTING_CORNERS: Point[] = [
  { x: -18, y: -18 },
  { x: 6, y: -18 },
  { x: 6, y: 6 },
  { x: -18, y: 6 },
];

export function TargetCursor({
  targetSelector = 'a, button:not(:disabled), select:not(:disabled), summary, [role="button"], .cursor-target',
  spinDuration = 2.4,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
  cursorColor = "var(--page-text)",
  cursorColorOnTarget = "#2563eb",
}: TargetCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const cornerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const pointerRef = useRef<Point>({ x: -100, y: -100 });
  const spinRef = useRef<gsap.core.Tween | null>(null);
  const spinTimerRef = useRef<number | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => setPortalReady(true), []);

  const setCornerColor = useCallback((color: string) => {
    const corners = cornerRefs.current.filter((corner): corner is HTMLDivElement => Boolean(corner));
    gsap.to(corners, { borderColor: color, duration: 0.15, overwrite: "auto" });
    if (dotRef.current) gsap.to(dotRef.current, { backgroundColor: color, duration: 0.15, overwrite: "auto" });
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !portalReady || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const corners = cornerRefs.current.filter((corner): corner is HTMLDivElement => Boolean(corner));
    const root = document.documentElement;
    if (hideDefaultCursor) root.dataset.targetCursor = "true";

    const pageZoom = () => Number.parseFloat(window.getComputedStyle(document.body).zoom) || 1;
    const cursorCoordinate = (value: number) => value / pageZoom();
    const clearSpinTimer = () => {
      if (spinTimerRef.current === null) return;
      window.clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    };

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: cursorCoordinate(window.innerWidth / 2),
      y: cursorCoordinate(window.innerHeight / 2),
      opacity: 0,
    });
    corners.forEach((corner, index) => gsap.set(corner, RESTING_CORNERS[index]));

    const moveX = gsap.quickTo(cursor, "x", { duration: reducedMotion ? 0 : 0.1, ease: "power3.out" });
    const moveY = gsap.quickTo(cursor, "y", { duration: reducedMotion ? 0 : 0.1, ease: "power3.out" });

    const startSpin = () => {
      if (activeTargetRef.current) return;
      clearSpinTimer();
      spinRef.current?.kill();
      if (reducedMotion) {
        gsap.set(cursor, { rotation: 0 });
        return;
      }
      spinRef.current = gsap.to(cursor, {
        rotation: "+=360",
        duration: Math.max(0.5, spinDuration),
        ease: "none",
        repeat: -1,
      });
    };

    const restoreCorners = () => {
      corners.forEach((corner, index) => {
        gsap.to(corner, {
          ...RESTING_CORNERS[index],
          duration: reducedMotion ? 0 : 0.28,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    };

    const leaveTarget = () => {
      if (!activeTargetRef.current) return;
      activeTargetRef.current = null;
      setCornerColor(cursorColor);
      restoreCorners();
      clearSpinTimer();
      spinTimerRef.current = window.setTimeout(startSpin, reducedMotion ? 0 : 60);
    };

    const enterTarget = (target: HTMLElement) => {
      if (activeTargetRef.current === target) return;
      activeTargetRef.current = target;
      clearSpinTimer();
      spinRef.current?.kill();
      spinRef.current = null;
      gsap.killTweensOf(cursor, "rotation");
      gsap.set(cursor, { rotation: 0 });
      const v2Accent = target.closest(".v2-shell")
        ? getComputedStyle(target).getPropertyValue("--v2-accent-text").trim()
        : "";
      setCornerColor(v2Accent || cursorColorOnTarget);
    };

    const syncV2Palette = () => {
      const target = activeTargetRef.current;
      if (!target?.closest(".v2-shell")) return;
      setCornerColor(getComputedStyle(target).getPropertyValue("--v2-accent-text").trim() || cursorColorOnTarget);
    };
    const paletteObserver = new MutationObserver(syncV2Palette);
    paletteObserver.observe(root, { attributes: true, attributeFilter: ["data-v2-palette", "data-theme"] });

    const elementAtPointer = () => document.elementFromPoint(pointerRef.current.x, pointerRef.current.y);
    const targetAtPointer = () => {
      const element = elementAtPointer();
      if (!element || element.closest(TEXT_SELECTOR)) return null;
      return element.closest<HTMLElement>(targetSelector);
    };

    const updateLockedCorners = () => {
      const target = activeTargetRef.current;
      if (!target?.isConnected) {
        leaveTarget();
        return;
      }

      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        leaveTarget();
        return;
      }

      const zoom = pageZoom();
      const pointer = pointerRef.current;
      const border = 3 * zoom;
      const cornerSize = 12 * zoom;
      const desired: Point[] = [
        { x: rect.left - border, y: rect.top - border },
        { x: rect.right + border - cornerSize, y: rect.top - border },
        { x: rect.right + border - cornerSize, y: rect.bottom + border - cornerSize },
        { x: rect.left - border, y: rect.bottom + border - cornerSize },
      ];
      const strength = reducedMotion || !parallaxOn ? 1 : Math.min(1, Math.max(0.2, 1 - hoverDuration) * 0.42);

      corners.forEach((corner, index) => {
        const targetX = (desired[index].x - pointer.x) / zoom;
        const targetY = (desired[index].y - pointer.y) / zoom;
        const currentX = Number(gsap.getProperty(corner, "x")) || 0;
        const currentY = Number(gsap.getProperty(corner, "y")) || 0;
        gsap.set(corner, {
          x: currentX + (targetX - currentX) * strength,
          y: currentY + (targetY - currentY) * strength,
        });
      });
    };

    const syncTarget = () => {
      const nextTarget = targetAtPointer();
      if (nextTarget !== activeTargetRef.current) {
        if (nextTarget) enterTarget(nextTarget);
        else leaveTarget();
      }
      if (!activeTargetRef.current) return;
      gsap.set(cursor, { x: cursorCoordinate(pointerRef.current.x), y: cursorCoordinate(pointerRef.current.y) });
      updateLockedCorners();
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      const editing = Boolean((event.target instanceof Element ? event.target : elementAtPointer())?.closest(TEXT_SELECTOR));
      gsap.to(cursor, { opacity: editing ? 0 : 1, duration: reducedMotion ? 0 : 0.1, overwrite: "auto" });
      syncTarget();
      if (!activeTargetRef.current) {
        moveX(cursorCoordinate(event.clientX));
        moveY(cursorCoordinate(event.clientY));
      }
    };

    const tick = () => {
      if (!activeTargetRef.current) return;
      syncTarget();
    };
    const handlePointerLeave = () => gsap.to(cursor, { opacity: 0, duration: 0.12 });
    const handlePointerEnter = () => gsap.to(cursor, { opacity: 1, duration: 0.12 });
    const handlePointerDown = () => gsap.to(cursor, { scale: 0.86, duration: reducedMotion ? 0 : 0.1 });
    const handlePointerUp = () => gsap.to(cursor, { scale: 1, duration: reducedMotion ? 0 : 0.18, ease: "back.out(2)" });
    const handleViewportChange = () => syncTarget();

    startSpin();
    gsap.ticker.add(tick);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    document.documentElement.addEventListener("pointerenter", handlePointerEnter);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("scroll", handleViewportChange, { passive: true });
    window.addEventListener("resize", handleViewportChange);

    return () => {
      delete root.dataset.targetCursor;
      paletteObserver.disconnect();
      clearSpinTimer();
      spinRef.current?.kill();
      gsap.ticker.remove(tick);
      gsap.killTweensOf([cursor, dot, ...corners]);
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      document.documentElement.removeEventListener("pointerenter", handlePointerEnter);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [cursorColor, cursorColorOnTarget, hideDefaultCursor, hoverDuration, parallaxOn, portalReady, setCornerColor, spinDuration, targetSelector]);

  if (!portalReady) return null;

  return createPortal((
    <div ref={cursorRef} className="target-cursor" aria-hidden="true">
      <div ref={dotRef} className="target-cursor__dot" style={{ backgroundColor: cursorColor }} />
      {["tl", "tr", "br", "bl"].map((position, index) => (
        <div
          key={position}
          ref={(element) => { cornerRefs.current[index] = element; }}
          className={`target-cursor__corner target-cursor__corner--${position}`}
          style={{ borderColor: cursorColor }}
        />
      ))}
    </div>
  ), document.documentElement);
}
