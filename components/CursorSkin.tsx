"use client";

import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CURSOR_TARGET_SELECTOR, CURSOR_TEXT_SELECTOR, cursorVariantFor } from "@/lib/cursor";

/**
 * The pointer for layouts that do not use the snapping brackets of <TargetCursor>.
 *
 * Two independently positioned layers: a lead ring that trails the pointer and a tip
 * that sits exactly on it. GSAP owns the transform of those two wrappers and nothing
 * else — every shape change is a CSS transition on their children, so the two never
 * fight over the same property.
 */
const noopSubscribe = () => () => {};

export function CursorSkin() {
  const variant = cursorVariantFor(usePathname());
  const leadRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  // React cannot render a portal on the server, so hold off until the client mounts.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    const lead = leadRef.current;
    const tip = tipRef.current;
    if (!lead || !tip) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const root = document.documentElement;
    root.dataset.targetCursor = "true";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Desktop page zoom scales the whole document; pointer coords are not scaled.
    const pageZoom = () => Number.parseFloat(window.getComputedStyle(document.body).zoom) || 1;

    // quickTo with a zero duration never writes, so a no-lag layer needs a plain set.
    const mover = (element: HTMLElement, duration: number) => {
      if (duration <= 0) return (x: number, y: number) => gsap.set(element, { x, y });
      const toX = gsap.quickTo(element, "x", { duration, ease: "power3.out" });
      const toY = gsap.quickTo(element, "y", { duration, ease: "power3.out" });
      return (x: number, y: number) => { toX(x); toY(y); };
    };

    const moveLead = mover(lead, reduced ? 0 : 0.16);
    // The reticle is an instrument: it sits exactly under the pointer, never behind it.
    const moveTip = mover(tip, reduced || variant === "reticle" ? 0 : 0.05);

    let state = "";
    let pressed = false;

    const apply = (next: string, press: boolean) => {
      if (next !== state) {
        state = next;
        lead.dataset.state = next;
        tip.dataset.state = next;
      }
      if (press !== pressed) {
        pressed = press;
        lead.dataset.press = String(press);
        tip.dataset.press = String(press);
      }
    };

    const stateFor = (element: Element | null) => {
      if (!element) return "hidden";
      if (element.closest(CURSOR_TEXT_SELECTOR)) return "hidden";
      return element.closest(CURSOR_TARGET_SELECTOR) ? "target" : "idle";
    };

    const onPointerMove = (event: PointerEvent) => {
      const zoom = pageZoom();
      moveLead(event.clientX / zoom, event.clientY / zoom);
      moveTip(event.clientX / zoom, event.clientY / zoom);
      const under = event.target instanceof Element ? event.target : document.elementFromPoint(event.clientX, event.clientY);
      apply(stateFor(under), pressed);
    };

    const onPointerDown = (event: PointerEvent) => {
      const under = event.target instanceof Element ? event.target : null;
      apply(stateFor(under), true);
    };
    const onPointerUp = () => apply(state, false);
    const onLeave = () => apply("hidden", false);
    const onEnter = (event: PointerEvent) => apply(stateFor(event.target instanceof Element ? event.target : null), pressed);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerenter", onEnter);

    return () => {
      delete root.dataset.targetCursor;
      gsap.killTweensOf([lead, tip]);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerenter", onEnter);
    };
  }, [variant, mounted]);

  if (!mounted || variant === "bracket") return null;

  return createPortal((
    <div className={`cursor-skin cursor-skin--${variant}`} aria-hidden="true">
      <span ref={leadRef} className="cursor-skin__lead" data-state="hidden"><i /></span>
      <span ref={tipRef} className="cursor-skin__tip" data-state="hidden">
        <i className="cursor-skin__dot" />
        {variant === "reticle" && (
          <span className="cursor-skin__arms">
            <i className="cursor-skin__arm cursor-skin__arm--n" />
            <i className="cursor-skin__arm cursor-skin__arm--e" />
            <i className="cursor-skin__arm cursor-skin__arm--s" />
            <i className="cursor-skin__arm cursor-skin__arm--w" />
          </span>
        )}
      </span>
    </div>
  ), document.documentElement);
}
