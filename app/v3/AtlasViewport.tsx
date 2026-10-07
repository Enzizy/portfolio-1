"use client";

import Link from "next/link";
import { Crosshair, Hand, Keyboard, List, Map as MapIcon, Maximize2, Minus, MousePointerClick, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { PortfolioVersionSwitch } from "@/components/PortfolioVersionSwitch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WORLD, routeStations, stations, type StationId } from "./atlas";

const MIN_Z = 0.14;
const MAX_Z = 1.7;
const FLY_MS = 720;
/** Below this zoom the plates collapse to their titles, so the whole map stays readable. */
const DETAIL_Z = 0.46;

type Camera = { cx: number; cy: number; z: number };
type Rect = { x: number; y: number; w: number; h: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/* The "how to fly this thing" card lives in sessionStorage, which is an external store. */
const HINT_KEY = "v3-atlas-hint";
const hintListeners = new Set<() => void>();
let hintDismissed = false;

function subscribeHint(listener: () => void) {
  hintListeners.add(listener);
  return () => { hintListeners.delete(listener); };
}

function readHint() {
  if (hintDismissed) return false;
  try { return sessionStorage.getItem(HINT_KEY) !== "1"; } catch { return true; }
}

function forgetHint() {
  hintDismissed = true;
  try { sessionStorage.setItem(HINT_KEY, "1"); } catch { /* private mode */ }
  for (const listener of hintListeners) listener();
}

export function AtlasViewport({ children, fontClass = "" }: { children: ReactNode; fontClass?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);
  const zoomReadoutRef = useRef<HTMLSpanElement>(null);
  const coordReadoutRef = useRef<HTMLSpanElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const minimapViewRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);

  // Opens on a wide shot of the whole sheet, then flies down to the origin plate.
  const cam = useRef<Camera>({ cx: WORLD.w / 2, cy: WORLD.h / 2, z: 0.2 });
  const introRun = useRef(false);
  const rects = useRef<Partial<Record<StationId, Rect>>>({});
  const flight = useRef<number>(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const dragging = useRef(false);
  const reducedMotion = useRef(false);
  const spaceHeld = useRef(false);
  const moved = useRef(0);
  const tap = useRef<{ station: StationId | null; x: number; y: number } | null>(null);
  /** The plate the camera was last flown to — tapping it again should not re-frame it. */
  const framed = useRef<StationId | null>("identity");

  const [mode, setMode] = useState<"map" | "list">("map");
  const [narrow, setNarrow] = useState(false);
  const [active, setActive] = useState<StationId>("identity");
  const [lowDetail, setLowDetail] = useState(false);
  const hintOpen = useSyncExternalStore(subscribeHint, readHint, () => false);

  const isMap = mode === "map" && !narrow;
  const isMapRef = useRef(isMap);
  useEffect(() => { isMapRef.current = isMap; }, [isMap]);

  /* ---------------------------------------------------------------- camera */

  const paint = useCallback(() => {
    const viewport = viewportRef.current;
    const world = worldRef.current;
    if (!viewport || !world) return;
    const { cx, cy, z } = cam.current;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const tx = vw / 2 - cx * z;
    const ty = vh / 2 - cy * z;

    world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${z})`;
    if (driftRef.current) driftRef.current.style.transform = `translate3d(${tx * 0.34}px, ${ty * 0.34}px, 0)`;
    if (zoomReadoutRef.current) zoomReadoutRef.current.textContent = `${Math.round(z * 100)}%`;
    if (coordReadoutRef.current) coordReadoutRef.current.textContent = `x ${Math.round(cx)}  y ${Math.round(cy)}`;

    if (minimapViewRef.current) {
      const style = minimapViewRef.current.style;
      style.left = `${((cx - vw / 2 / z) / WORLD.w) * 100}%`;
      style.top = `${((cy - vh / 2 / z) / WORLD.h) * 100}%`;
      style.width = `${(vw / z / WORLD.w) * 100}%`;
      style.height = `${(vh / z / WORLD.h) * 100}%`;
    }

    const low = z < DETAIL_Z;
    setLowDetail((current) => (current === low ? current : low));

    // Whichever plate the crosshair sits in wins; otherwise the nearest centre.
    let nearest: StationId = "identity";
    let bestScore = Infinity;
    for (const station of stations) {
      const rect = rects.current[station.id];
      if (!rect) continue;
      const inside = cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h;
      const dx = cx - (rect.x + rect.w / 2);
      const dy = cy - (rect.y + rect.h / 2);
      const score = Math.hypot(dx, dy) - (inside ? 1e6 : 0);
      if (score < bestScore) {
        bestScore = score;
        nearest = station.id;
      }
    }
    setActive((current) => (current === nearest ? current : nearest));
  }, []);

  const setCamera = useCallback((next: Partial<Camera>) => {
    const camera = cam.current;
    if (next.z != null) camera.z = clamp(next.z, MIN_Z, MAX_Z);
    if (next.cx != null) camera.cx = clamp(next.cx, -600, WORLD.w + 600);
    if (next.cy != null) camera.cy = clamp(next.cy, -600, WORLD.h + 600);
    paint();
  }, [paint]);

  const flyTo = useCallback((target: Camera) => {
    cancelAnimationFrame(flight.current);
    const from = { ...cam.current };
    const to = {
      cx: clamp(target.cx, -600, WORLD.w + 600),
      cy: clamp(target.cy, -600, WORLD.h + 600),
      z: clamp(target.z, MIN_Z, MAX_Z),
    };
    if (reducedMotion.current) {
      cam.current = to;
      paint();
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FLY_MS);
      const e = easeInOutCubic(t);
      cam.current = {
        cx: from.cx + (to.cx - from.cx) * e,
        cy: from.cy + (to.cy - from.cy) * e,
        // Zoom is interpolated geometrically so the flight feels even at both ends.
        z: from.z * (to.z / from.z) ** e,
      };
      paint();
      if (t < 1) flight.current = requestAnimationFrame(step);
    };
    flight.current = requestAnimationFrame(step);
  }, [paint]);

  const frameStation = useCallback((id: StationId): Camera | null => {
    const rect = rects.current[id];
    const viewport = viewportRef.current;
    if (!rect || !viewport) return null;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    // The bar and the side column float over the sheet, so a plate centred in the
    // viewport ends up half-hidden under them. Frame it in the clear area instead.
    const side = sideRef.current?.getBoundingClientRect();
    const left = side && side.width ? side.right + 18 : 0;
    const top = (barRef.current?.getBoundingClientRect().height ?? 0) + 12;
    const availW = Math.max(240, vw - left);
    const availH = Math.max(240, vh - top);

    // Vertical breathing room scales with the window: a fixed 120px gutter costs a
    // short laptop screen most of its zoom.
    const padX = availW > 820 ? 120 : 44;
    const padY = Math.min(padX, Math.round(availH * 0.08));
    const fit = Math.min((availW - padX * 2) / rect.w, (availH - padY * 2) / rect.h);
    const z = clamp(fit, 0.5, 1.05);

    // Where the clear area's centre sits, relative to the viewport centre the camera
    // actually points at.
    const shiftX = (left + availW / 2 - vw / 2) / z;
    const shiftY = (top + availH / 2 - vh / 2) / z;

    // Tall plates (the project cluster) get their header framed rather than their middle.
    const tall = rect.h > availH / z;
    const cy = tall
      ? rect.y - (top + padY - vh / 2) / z
      : rect.y + rect.h / 2 - shiftY;

    return { cx: rect.x + rect.w / 2 - shiftX, cy, z };
  }, []);

  const goToStation = useCallback((id: StationId) => {
    const target = frameStation(id);
    if (target) flyTo(target);
    framed.current = id;
    setActive(id);
  }, [flyTo, frameStation]);

  /** Drives the hand-mode affordance: the viewport cursor and the reticle pointer. */
  const setPanning = useCallback((on: boolean) => {
    viewportRef.current?.toggleAttribute("data-grabbing", on);
    document.documentElement.toggleAttribute("data-atlas-pan", on);
  }, []);

  const fitWorld = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const z = Math.min(viewport.clientWidth / (WORLD.w + 280), viewport.clientHeight / (WORLD.h + 280));
    flyTo({ cx: WORLD.w / 2, cy: WORLD.h / 2, z });
  }, [flyTo]);

  const zoomBy = useCallback((factor: number) => {
    flyTo({ ...cam.current, z: cam.current.z * factor });
  }, [flyTo]);

  /* ------------------------------------------------------------ measurement */

  const measure = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    for (const station of stations) {
      const element = world.querySelector<HTMLElement>(`[data-station="${station.id}"]`);
      if (!element) continue;
      // The scale lives on an ancestor, so offset sizes are already world units.
      rects.current[station.id] = { x: station.x, y: station.y, w: element.offsetWidth, h: element.offsetHeight };
      const dot = minimapRef.current?.querySelector<HTMLElement>(`[data-dot="${station.id}"]`);
      if (dot) dot.style.height = `${(element.offsetHeight / WORLD.h) * 100}%`;
    }
    paint();
  }, [paint]);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const media = window.matchMedia("(max-width: 900px)");
    const syncNarrow = () => setNarrow(media.matches);
    syncNarrow();
    media.addEventListener("change", syncNarrow);

    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    const onResize = () => { measure(); paint(); };
    window.addEventListener("resize", onResize);

    // Let the wide shot land for a beat, then descend on the origin.
    let intro = 0;
    if (!introRun.current) {
      introRun.current = true;
      intro = window.setTimeout(() => goToStation("identity"), 520);
    }

    return () => {
      media.removeEventListener("change", syncNarrow);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(intro);
      cancelAnimationFrame(flight.current);
    };
  }, [goToStation, measure, paint]);

  const dismissHint = useCallback(() => forgetHint(), []);

  /* ------------------------------------------------------------ interaction */

  const zoomAt = useCallback((factor: number, screenX: number, screenY: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const box = viewport.getBoundingClientRect();
    const { cx, cy, z } = cam.current;
    const nextZ = clamp(z * factor, MIN_Z, MAX_Z);
    if (nextZ === z) return;
    const offsetX = screenX - box.left - box.width / 2;
    const offsetY = screenY - box.top - box.height / 2;
    // Keep the world point under the cursor pinned while the scale changes.
    setCamera({ cx: cx + offsetX / z - offsetX / nextZ, cy: cy + offsetY / z - offsetY / nextZ, z: nextZ });
  }, [setCamera]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      if (!isMapRef.current) return;
      event.preventDefault();
      cancelAnimationFrame(flight.current);
      framed.current = null;
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
      if (event.ctrlKey || event.metaKey) {
        zoomAt(Math.exp((-event.deltaY * scale) / 260), event.clientX, event.clientY);
      } else {
        const { z } = cam.current;
        setCamera({ cx: cam.current.cx + (event.deltaX * scale) / z, cy: cam.current.cy + (event.deltaY * scale) / z });
      }
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [setCamera, zoomAt]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMap) return;
    const target = event.target as HTMLElement;
    const interactive = target.closest("a, button, input, textarea, select, label, [data-no-pan]");
    // Held space and the middle button pan from anywhere, links included — the tool
    // is in "hand" mode, exactly as Figma behaves.
    const forcePan = spaceHeld.current || event.button === 1;
    if (interactive && !forcePan) return;
    if (forcePan) event.preventDefault();

    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size !== 1) return;

    dragging.current = true;
    moved.current = 0;
    // Remember where a tap started so pointerup can tell a click from a drag.
    tap.current = interactive || forcePan ? null : {
      station: (target.closest<HTMLElement>("[data-station]")?.dataset.station ?? null) as StationId | null,
      x: event.clientX,
      y: event.clientY,
    };
    cancelAnimationFrame(flight.current);
    viewportRef.current?.setPointerCapture(event.pointerId);
    setPanning(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMap) return;
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      if (pinch.current) {
        const { z } = cam.current;
        zoomAt(dist / pinch.current.dist, midX, midY);
        setCamera({ cx: cam.current.cx - (midX - pinch.current.cx) / z, cy: cam.current.cy - (midY - pinch.current.cy) / z });
      }
      pinch.current = { dist, cx: midX, cy: midY };
      return;
    }

    if (!dragging.current) return;
    const { z } = cam.current;
    moved.current += Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
    if (moved.current > 5) framed.current = null;
    setCamera({ cx: cam.current.cx - (event.clientX - previous.x) / z, cy: cam.current.cy - (event.clientY - previous.y) / z });
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size > 0) return;

    dragging.current = false;
    setPanning(spaceHeld.current);

    // A tap that did not turn into a drag opens the plate under it, so a card can be
    // read without reaching for the rail. Tapping the framed plate is left alone, or
    // selecting its text would be impossible.
    const started = tap.current;
    tap.current = null;
    if (!isMapRef.current || !started?.station || moved.current > 5) return;
    if (Math.hypot(event.clientX - started.x, event.clientY - started.y) > 5) return;
    if (framed.current === started.station) return;
    goToStation(started.station);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isMapRef.current || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;

      // Held space is hand mode, as in Figma — unless a control has focus, where
      // space still has to mean "activate this".
      if (event.code === "Space") {
        if (document.activeElement?.closest("a, button, [role='button']")) return;
        event.preventDefault();
        if (spaceHeld.current) return;
        spaceHeld.current = true;
        setPanning(true);
        return;
      }

      const step = 180 / cam.current.z;
      const key = event.key;
      const index = Number(key);

      if (Number.isInteger(index) && index >= 1 && index <= routeStations.length) {
        event.preventDefault();
        goToStation(routeStations[index - 1].id);
        return;
      }

      switch (key) {
        case "ArrowLeft": case "a": case "A": setCamera({ cx: cam.current.cx - step }); break;
        case "ArrowRight": case "d": case "D": setCamera({ cx: cam.current.cx + step }); break;
        case "ArrowUp": case "w": case "W": setCamera({ cy: cam.current.cy - step }); break;
        case "ArrowDown": case "s": case "S": setCamera({ cy: cam.current.cy + step }); break;
        case "+": case "=": zoomBy(1.25); break;
        case "-": case "_": zoomBy(0.8); break;
        case "0": case "f": case "F": fitWorld(); break;
        case "Home": goToStation("identity"); break;
        case "[": case "]": {
          const current = routeStations.findIndex((station) => station.id === active);
          const next = (current + (key === "]" ? 1 : -1) + routeStations.length) % routeStations.length;
          goToStation(routeStations[next].id);
          break;
        }
        default: return;
      }
      event.preventDefault();
      if (hintOpen) dismissHint();
    };

    const releaseSpace = () => {
      if (!spaceHeld.current) return;
      spaceHeld.current = false;
      if (!dragging.current) setPanning(false);
    };
    const onKeyUp = (event: KeyboardEvent) => { if (event.code === "Space") releaseSpace(); };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    // Alt-tabbing away while space is down would otherwise leave hand mode stuck on.
    window.addEventListener("blur", releaseSpace);
    return () => {
      releaseSpace();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseSpace);
    };
  }, [active, dismissHint, fitWorld, goToStation, hintOpen, setCamera, setPanning, zoomBy]);

  // In-world links to other stations stay real anchors (they work in list mode and
  // without JS); on the map they become camera flights instead of page jumps.
  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isMapRef.current || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#v3-"]');
    if (!anchor) return;
    const id = anchor.getAttribute("href")!.slice(4) as StationId;
    if (!stations.some((station) => station.id === id)) return;
    event.preventDefault();
    goToStation(id);
    dismissHint();
  };

  // Tabbing through the page must move the camera too, or focus lands off-screen.
  // Native focusin rather than React's delegated onFocus: this must also catch focus
  // moved programmatically from outside React's tree (skip links, browser find).
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Anything that reveals an off-screen child — focus, find-in-page — makes the
    // browser scroll this overflow:hidden box, which silently desyncs the camera from
    // what is on screen. Pin it back to the origin; flying there is the camera's job.
    const unscroll = () => {
      if (!isMapRef.current) return;
      if (viewport.scrollLeft) viewport.scrollLeft = 0;
      if (viewport.scrollTop) viewport.scrollTop = 0;
    };

    const onFocusIn = (event: FocusEvent) => {
      unscroll();
      if (!isMapRef.current) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const id = target.closest<HTMLElement>("[data-station]")?.dataset.station as StationId | undefined;
      if (!id) return;
      const box = target.getBoundingClientRect();
      const view = viewport.getBoundingClientRect();
      const visible = box.top >= view.top + 80 && box.bottom <= view.bottom - 80
        && box.left >= view.left && box.right <= view.right;
      if (visible) setActive(id);
      else goToStation(id);
    };

    viewport.addEventListener("focusin", onFocusIn);
    viewport.addEventListener("scroll", unscroll, { passive: true });
    return () => {
      viewport.removeEventListener("focusin", onFocusIn);
      viewport.removeEventListener("scroll", unscroll);
    };
  }, [goToStation]);

  /* --------------------------------------------------------------- minimap */

  const minimapTo = (event: React.PointerEvent<HTMLDivElement>) => {
    const map = minimapRef.current;
    if (!map) return;
    const box = map.getBoundingClientRect();
    cancelAnimationFrame(flight.current);
    setCamera({
      cx: ((event.clientX - box.left) / box.width) * WORLD.w,
      cy: ((event.clientY - box.top) / box.height) * WORLD.h,
    });
  };

  const activeStation = stations.find((station) => station.id === active) ?? stations[0];

  return (
    <div className={`v3-root ${fontClass}`} data-mode={isMap ? "map" : "list"} data-detail={lowDetail ? "low" : "full"}>
      <header ref={barRef} className="v3-bar">
        <div className="v3-bar__brand">
          <Link href="/" className="v3-mark" aria-label="Zhyronne Batican, version 1">ZB<i>.</i></Link>
          <PortfolioVersionSwitch version={3} />
        </div>

        <p className="v3-bar__now" aria-live="polite">
          <span className="v3-bar__code">{activeStation.code}</span>
          <strong>{activeStation.label}</strong>
          <small>{activeStation.hint}</small>
        </p>

        <div className="v3-bar__tools">
          <button
            type="button"
            className="v3-chip"
            onClick={() => setMode(isMap ? "list" : "map")}
            aria-pressed={!isMap}
            disabled={narrow}
            title={narrow ? "The map needs a wider screen" : undefined}
          >
            {isMap ? <List size={14} aria-hidden="true" /> : <MapIcon size={14} aria-hidden="true" />}
            {isMap ? "Read as a list" : "Back to the map"}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div
        ref={viewportRef}
        className="v3-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onClickCapture={onClickCapture}
      >
        <div ref={driftRef} className="v3-drift" aria-hidden="true" />
        <div ref={worldRef} className="v3-world">
          {children}
        </div>
        <div className="v3-vignette" aria-hidden="true" />
      </div>

      {hintOpen && (
        <div className="v3-hint" role="note">
          <p><Hand size={15} aria-hidden="true" /><span>Drag the sheet to move, or hold <kbd>space</kbd> to pan from anywhere.</span></p>
          <p><Crosshair size={15} aria-hidden="true" /><span><kbd>Ctrl</kbd> or <kbd>⌘</kbd> and scroll to zoom. Scroll alone pans.</span></p>
          <p><MousePointerClick size={15} aria-hidden="true" /><span>Click any plate to fly to it and read it.</span></p>
          <p><Keyboard size={15} aria-hidden="true" /><span>Press <kbd>1</kbd>–<kbd>8</kbd> to jump between stations, <kbd>0</kbd> to see the whole sheet.</span></p>
          <button type="button" onClick={dismissHint}>Got it</button>
        </div>
      )}

      <div ref={sideRef} className="v3-side">
        <nav className="v3-rail" aria-label="Atlas stations">
          {routeStations.map((station, index) => (
            <button
              key={station.id}
              type="button"
              className="v3-rail__item"
              aria-current={active === station.id ? "location" : undefined}
              onClick={() => {
                if (isMap) { goToStation(station.id); dismissHint(); }
                else document.getElementById(`v3-${station.id}`)?.scrollIntoView({ behavior: reducedMotion.current ? "auto" : "smooth" });
              }}
            >
              <span className="v3-rail__code">{station.code}</span>
              <span className="v3-rail__label">{station.label}</span>
              <span className="v3-rail__key" aria-hidden="true">{index + 1}</span>
            </button>
          ))}
        </nav>

        <div className="v3-dock">
        <div
          ref={minimapRef}
          className="v3-minimap"
          onPointerDown={(event) => { (event.target as HTMLElement).setPointerCapture?.(event.pointerId); minimapTo(event); }}
          onPointerMove={(event) => { if (event.buttons === 1) minimapTo(event); }}
          aria-hidden="true"
        >
          {stations.map((station) => (
            <span
              key={station.id}
              className="v3-minimap__dot"
              data-dot={station.id}
              data-active={active === station.id ? "true" : undefined}
              style={{ left: `${(station.x / WORLD.w) * 100}%`, top: `${(station.y / WORLD.h) * 100}%`, width: `${(station.w / WORLD.w) * 100}%` }}
            />
          ))}
          <div ref={minimapViewRef} className="v3-minimap__view" />
        </div>

        <div className="v3-readout">
          <span ref={coordReadoutRef}>x —  y —</span>
          <span className="v3-readout__zoom"><Crosshair size={11} aria-hidden="true" /> <span ref={zoomReadoutRef}>—</span></span>
        </div>

        <div className="v3-zoom" role="group" aria-label="Zoom">
          <button type="button" onClick={() => zoomBy(0.8)} aria-label="Zoom out"><Minus size={15} /></button>
          <button type="button" onClick={fitWorld} aria-label="Fit the whole atlas"><Maximize2 size={14} /></button>
          <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom in"><Plus size={15} /></button>
        </div>
        </div>
      </div>
    </div>
  );
}
