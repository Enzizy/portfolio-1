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
/** Zooming back in has to clear this before detail returns, so a wheel resting on the
    threshold cannot flip the whole sheet's layout every frame. */
const DETAIL_Z_EXIT = 0.5;
/** Matches the drift layer's background-size, so wrapping its offset is seamless. */
const DRIFT_PERIOD = 170;
/** Per-frame (60 Hz) velocity retention once a drag is released. */
const GLIDE_DECAY = 0.94;

type Camera = { cx: number; cy: number; z: number };
type Rect = { x: number; y: number; w: number; h: number };
/** Viewport metrics, cached so the hot path never forces a layout to read them. */
type Box = { w: number; h: number; left: number; top: number; bw: number; bh: number };

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
  const box = useRef<Box>({ w: 0, h: 0, left: 0, top: 0, bw: 0, bh: 0 });
  /** Pending paint; every camera change in a frame collapses into one write pass. */
  const frame = useRef(0);
  const moving = useRef(false);
  const settle = useRef(0);
  const readouts = useRef({ zoom: "", coord: "" });
  /** The transform last written, so an unmoved camera writes nothing. */
  const painted = useRef({ tx: NaN, ty: NaN, z: NaN });
  const lowDetailRef = useRef(false);
  /** Smoothed drag velocity in screen px/ms, for the release glide. */
  const velocity = useRef({ x: 0, y: 0, t: 0 });

  const [mode, setMode] = useState<"map" | "list">("map");
  const [narrow, setNarrow] = useState(false);
  const [active, setActive] = useState<StationId>("identity");
  const [lowDetail, setLowDetail] = useState(false);
  const hintOpen = useSyncExternalStore(subscribeHint, readHint, () => false);

  const isMap = mode === "map" && !narrow;
  const isMapRef = useRef(isMap);
  useEffect(() => { isMapRef.current = isMap; }, [isMap]);

  /* ---------------------------------------------------------------- camera */

  /**
   * Writes the camera to the DOM. Write-only on purpose: it reads nothing from layout,
   * so a burst of wheel or pointer events can never force a synchronous reflow of the
   * 5540px world. Call `schedule` from event handlers; `render` only from inside a frame.
   */
  const render = useCallback(() => {
    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    const viewport = viewportRef.current;
    const world = worldRef.current;
    if (!viewport || !world) return;
    const { cx, cy, z } = cam.current;
    const { w: vw, h: vh } = box.current;
    const tx = vw / 2 - cx * z;
    const ty = vh / 2 - cy * z;

    // A plate resizing (the contact form growing, say) re-runs this with the camera
    // untouched: refresh the active station below, but leave the DOM alone.
    const last = painted.current;
    const still = last.tx === tx && last.ty === ty && last.z === z;
    if (!still) {
      painted.current = { tx, ty, z };
      world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${z})`;
      if (driftRef.current) {
        // The dot field repeats every DRIFT_PERIOD px, so only the remainder matters —
        // the layer stays one tile larger than the screen however far the camera roams.
        const wrap = (value: number) => ((value % DRIFT_PERIOD) + DRIFT_PERIOD) % DRIFT_PERIOD;
        driftRef.current.style.transform = `translate3d(${wrap(tx * 0.34)}px, ${wrap(ty * 0.34)}px, 0)`;
      }

      const zoomText = `${Math.round(z * 100)}%`;
      const coordText = `x ${Math.round(cx)}  y ${Math.round(cy)}`;
      if (zoomText !== readouts.current.zoom && zoomReadoutRef.current) zoomReadoutRef.current.textContent = readouts.current.zoom = zoomText;
      if (coordText !== readouts.current.coord && coordReadoutRef.current) coordReadoutRef.current.textContent = readouts.current.coord = coordText;

      if (minimapViewRef.current) {
        const style = minimapViewRef.current.style;
        style.left = `${((cx - vw / 2 / z) / WORLD.w) * 100}%`;
        style.top = `${((cy - vh / 2 / z) / WORLD.h) * 100}%`;
        style.width = `${(vw / z / WORLD.w) * 100}%`;
        style.height = `${(vh / z / WORLD.h) * 100}%`;
      }

      // While the sheet moves, plates sliding under a still pointer must not trigger
      // hover transitions (each one is a repaint inside the scaled layer).
      if (!moving.current) {
        moving.current = true;
        viewport.setAttribute("data-moving", "");
      }
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => {
        moving.current = false;
        viewport.removeAttribute("data-moving");
      }, 140);
    }

    const low = lowDetailRef.current ? z < DETAIL_Z_EXIT : z < DETAIL_Z;
    if (low !== lowDetailRef.current) {
      lowDetailRef.current = low;
      setLowDetail(low);
    }

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

  const schedule = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(render);
  }, [render]);

  /** Moves the camera; paints on the next frame unless already inside one. */
  const setCamera = useCallback((next: Partial<Camera>, now = false) => {
    const camera = cam.current;
    if (next.z != null) camera.z = clamp(next.z, MIN_Z, MAX_Z);
    if (next.cx != null) camera.cx = clamp(next.cx, -600, WORLD.w + 600);
    if (next.cy != null) camera.cy = clamp(next.cy, -600, WORLD.h + 600);
    if (now) render();
    else schedule();
  }, [render, schedule]);

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
      schedule();
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
      render();
      if (t < 1) flight.current = requestAnimationFrame(step);
    };
    flight.current = requestAnimationFrame(step);
  }, [render, schedule]);

  /** Lets a released drag coast to a stop instead of halting dead under the finger. */
  const glide = useCallback((vx: number, vy: number) => {
    cancelAnimationFrame(flight.current);
    if (reducedMotion.current) return;
    let last = performance.now();
    const step = (now: number) => {
      // A frame's timestamp can predate the call that queued it; never step backwards.
      const dt = clamp(now - last, 0, 48);
      last = now;
      const { z } = cam.current;
      setCamera({ cx: cam.current.cx - (vx * dt) / z, cy: cam.current.cy - (vy * dt) / z }, true);
      const decay = GLIDE_DECAY ** (dt / 16.67);
      vx *= decay;
      vy *= decay;
      if (Math.hypot(vx, vy) > 0.02) flight.current = requestAnimationFrame(step);
    };
    flight.current = requestAnimationFrame(step);
  }, [setCamera]);

  const frameStation = useCallback((id: StationId): Camera | null => {
    const rect = rects.current[id];
    const { w: vw, h: vh } = box.current;
    if (!rect || !vw) return null;

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
    const { w, h } = box.current;
    if (!w) return;
    const z = Math.min(w / (WORLD.w + 280), h / (WORLD.h + 280));
    flyTo({ cx: WORLD.w / 2, cy: WORLD.h / 2, z });
  }, [flyTo]);

  const zoomBy = useCallback((factor: number) => {
    flyTo({ ...cam.current, z: cam.current.z * factor });
  }, [flyTo]);

  /* ------------------------------------------------------------ measurement */

  const measure = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    // Every read first, then every write, so measuring costs one layout, not eight.
    const sizes = stations.map((station) => {
      const element = world.querySelector<HTMLElement>(`[data-station="${station.id}"]`);
      // The scale lives on an ancestor, so offset sizes are already world units.
      return element ? { station, w: element.offsetWidth, h: element.offsetHeight } : null;
    });
    for (const size of sizes) {
      if (!size) continue;
      const { station, w, h } = size;
      rects.current[station.id] = { x: station.x, y: station.y, w, h };
      const dot = minimapRef.current?.querySelector<HTMLElement>(`[data-dot="${station.id}"]`);
      if (dot) dot.style.height = `${(h / WORLD.h) * 100}%`;
    }
    schedule();
  }, [schedule]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const world = worldRef.current;
    if (!viewport || !world) return;

    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const media = window.matchMedia("(max-width: 900px)");
    const syncNarrow = () => setNarrow(media.matches);
    syncNarrow();
    media.addEventListener("change", syncNarrow);

    const readBox = () => {
      const rect = viewport.getBoundingClientRect();
      box.current = { w: viewport.clientWidth, h: viewport.clientHeight, left: rect.left, top: rect.top, bw: rect.width, bh: rect.height };
    };
    readBox();
    measure();
    render();

    // Observers fire after layout, so their reads are free; they also catch what a
    // window resize never did — web fonts landing, images sizing a plate, the
    // contact form swapping to its sent state.
    const viewObserver = new ResizeObserver(() => { readBox(); schedule(); });
    viewObserver.observe(viewport);
    // Zoomed-out plates wear oversized titles; framing must use their reading size.
    const plateObserver = new ResizeObserver(() => { if (!lowDetailRef.current) measure(); });
    world.querySelectorAll("[data-station]").forEach((element) => plateObserver.observe(element));

    // Let the wide shot land for a beat, then descend on the origin.
    // Marked as run only once it fires: Strict Mode's mount/unmount/mount would
    // otherwise clear the timer and then skip the intro on the real mount.
    let intro = 0;
    if (!introRun.current) {
      intro = window.setTimeout(() => {
        introRun.current = true;
        goToStation("identity");
      }, 520);
    }

    return () => {
      media.removeEventListener("change", syncNarrow);
      viewObserver.disconnect();
      plateObserver.disconnect();
      window.clearTimeout(intro);
      window.clearTimeout(settle.current);
      moving.current = false;
      viewport.removeAttribute("data-moving");
      cancelAnimationFrame(flight.current);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [goToStation, measure, render, schedule]);

  const dismissHint = useCallback(() => forgetHint(), []);

  /* ------------------------------------------------------------ interaction */

  const zoomAt = useCallback((factor: number, screenX: number, screenY: number) => {
    const { left, top, bw, bh } = box.current;
    const { cx, cy, z } = cam.current;
    const nextZ = clamp(z * factor, MIN_Z, MAX_Z);
    if (nextZ === z) return;
    const offsetX = screenX - left - bw / 2;
    const offsetY = screenY - top - bh / 2;
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
    velocity.current = { x: 0, y: 0, t: event.timeStamp };
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
      // A pinch never ends in a glide.
      velocity.current = { x: 0, y: 0, t: 0 };
      return;
    }

    if (!dragging.current) return;
    const { z } = cam.current;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    moved.current += Math.hypot(dx, dy);
    if (moved.current > 5) framed.current = null;

    // Exponentially smoothed, weighted by elapsed time so a burst of coalesced
    // events cannot spike the release speed.
    const sample = velocity.current;
    const dt = event.timeStamp - sample.t;
    if (sample.t && dt > 0) {
      const k = Math.min(1, dt / 40);
      sample.x += (dx / dt - sample.x) * k;
      sample.y += (dy / dt - sample.y) * k;
      sample.t = event.timeStamp;
    }

    setCamera({ cx: cam.current.cx - dx / z, cy: cam.current.cy - dy / z });
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size > 0) return;

    const wasDragging = dragging.current;
    dragging.current = false;
    setPanning(spaceHeld.current);

    // Coast only if the pointer was still moving when it let go; a drag that paused
    // before release should stay exactly where it was put down.
    const { x: vx, y: vy, t } = velocity.current;
    velocity.current = { x: 0, y: 0, t: 0 };
    if (wasDragging && isMapRef.current && event.type === "pointerup" && moved.current > 5 && t && event.timeStamp - t < 80) {
      const speed = Math.hypot(vx, vy);
      if (speed > 0.15) {
        const cap = Math.min(1, 4 / speed);
        glide(vx * cap, vy * cap);
      }
    }

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
      const rect = target.getBoundingClientRect();
      const view = viewport.getBoundingClientRect();
      const visible = rect.top >= view.top + 80 && rect.bottom <= view.bottom - 80
        && rect.left >= view.left && rect.right <= view.right;
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
    const area = map.getBoundingClientRect();
    cancelAnimationFrame(flight.current);
    setCamera({
      cx: ((event.clientX - area.left) / area.width) * WORLD.w,
      cy: ((event.clientY - area.top) / area.height) * WORLD.h,
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
