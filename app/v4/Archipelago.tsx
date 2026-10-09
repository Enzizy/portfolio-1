"use client";

import Link from "next/link";
import { BookOpen, Minus, Plus, Sailboat } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { PortfolioVersionSwitch } from "@/components/PortfolioVersionSwitch";
import type { Day, Engine } from "./_world/engine";
import { CHART, destinations, placeById, places } from "./_world/islands";
import type { Fonts } from "./_world/textures";

type View = "sea" | "page";
type Phase = "loading" | "ready" | "sailing" | "failed";

const chartLabels = new Set<string>(destinations.map((destination) => destination.id));

function supportsWebGL() {
  try {
    const probe = document.createElement("canvas");
    const context = probe.getContext("webgl2") ?? probe.getContext("webgl");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

/**
 * The V4 shell: the 3D sea behind, and in front of it the HUD and the island cards.
 * The cards are server-rendered children; at sea only the one for the island you
 * are moored at opens, and in "page" view they all read top to bottom.
 */
export function Archipelago({ className, fonts, days, children }: { className: string; fonts: Fonts; days: Day[]; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const boatRef = useRef<SVGGElement>(null);
  const [view, setView] = useState<View>("sea");
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [zone, setZone] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  // The 3D engine (and three.js with it) loads after first paint, behind the intro.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let engine: Engine | null = null;

    const boot = async () => {
      try {
        if (!supportsWebGL()) throw new Error("WebGL is unavailable");
        // Signs are lettered on canvases, so their fonts must be loaded first.
        await Promise.race([
          Promise.all([document.fonts.load(`600 40px ${fonts.display}`), document.fonts.load(`500 20px ${fonts.mono}`)]),
          new Promise((resolve) => window.setTimeout(resolve, 2500)),
        ]);
        const { createArchipelago } = await import("./_world/engine");
        if (disposed) return;
        engine = createArchipelago({
          canvas,
          fonts,
          days,
          onProgress: (value) => setProgress(value),
          onZone: (id) => {
            setZone(id);
            setDismissed(null);
          },
          onBoat: (x, z, heading) => {
            boatRef.current?.setAttribute("transform", `translate(${x.toFixed(1)} ${z.toFixed(1)}) rotate(${((heading * 180) / Math.PI).toFixed(1)})`);
          },
        });
        engineRef.current = engine;
        await engine.ready;
        if (!disposed) setPhase((current) => (current === "loading" ? "ready" : current));
      } catch (error) {
        console.warn("[v4] falling back to the page view:", error);
        if (!disposed) {
          setPhase("failed");
          setView("page");
        }
      }
    };
    boot();

    return () => {
      disposed = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, [days, fonts]);

  const sailing = phase === "sailing" && view === "sea";

  // Open the card for the island you are moored at, unless you closed it.
  useEffect(() => {
    rootRef.current?.querySelectorAll<HTMLElement>("[data-panel]").forEach((panel) => {
      panel.toggleAttribute("data-open", sailing && panel.dataset.panel === zone && dismissed !== zone);
    });
  }, [zone, dismissed, sailing]);

  useEffect(() => {
    engineRef.current?.setPaused(view === "page");
    if (view === "page") window.scrollTo({ top: 0 });
  }, [view]);

  const setSail = useCallback(() => {
    engineRef.current?.start();
    setPhase("sailing");
  }, []);

  const sailTo = useCallback((id: string) => {
    if (!engineRef.current) return;
    engineRef.current.sailTo(id);
    setPhase("sailing");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && zone) setDismissed(zone);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zone]);

  // Buttons inside the server-rendered cards carry data attributes instead of
  // handlers: data-sail="<place>" sails there, data-panel-close closes the card.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const sail = target.closest<HTMLElement>("[data-sail]");
    if (sail?.dataset.sail) {
      if (view === "page") document.getElementById(`v4-${sail.dataset.sail}`)?.scrollIntoView({ behavior: "smooth" });
      else sailTo(sail.dataset.sail);
      return;
    }
    if (target.closest("[data-panel-close]")) setDismissed(zone);
  };

  const here = zone ? placeById.get(zone) : undefined;
  const activeDestination = here?.kind === "project" ? "project-0" : zone;

  return (
    <div ref={rootRef} className={`v4-root ${className}`} data-view={view} data-phase={phase} onClick={onClick}>
      <div className="v4-stage" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>

      <header className="v4-top">
        <div className="v4-top__brand">
          <Link href="/" className="v4-mark" aria-label="Zhyronne Batican, version 1">ZB<i>.</i></Link>
          <PortfolioVersionSwitch version={4} />
        </div>
        {phase !== "failed" && (
          <button type="button" className="v4-chip" onClick={() => setView(view === "sea" ? "page" : "sea")}>
            {view === "sea" ? <BookOpen size={15} aria-hidden="true" /> : <Sailboat size={15} aria-hidden="true" />}
            {view === "sea" ? "Read as a page" : "Back to the sea"}
          </button>
        )}
      </header>

      {view === "sea" && phase !== "sailing" && (
        <div className="v4-intro">
          <p className="v4-intro__kicker">Portfolio V4 · an archipelago</p>
          <p className="v4-intro__title">Zhyronne Batican</p>
          <p className="v4-intro__lede">
            Full-stack developer, AI engineer and UI/UX designer from the Philippines. Every island out here holds a part of
            my work — take the bangka out and explore.
          </p>
          <div className="v4-intro__actions">
            <button type="button" className="v4-button" onClick={setSail} disabled={phase !== "ready"}>
              <Sailboat size={16} aria-hidden="true" />
              {phase === "ready" ? "Set sail" : `Charting the islands… ${Math.round(progress * 100)}%`}
            </button>
            <button type="button" className="v4-button v4-button--ghost" onClick={() => setView("page")}>
              Read it as a page
            </button>
          </div>
          <p className="v4-intro__hint">
            <span className="v4-hint--fine">Click the water to sail there · or steer with WASD / arrow keys</span>
            <span className="v4-hint--touch">Tap the water to sail there · pinch to zoom</span>
          </p>
        </div>
      )}

      {sailing && (
        <>
          <nav className="v4-places" aria-label="Islands">
            {destinations.map((destination) => (
              <button
                key={destination.id}
                type="button"
                aria-current={activeDestination === destination.id ? "location" : undefined}
                onClick={() => sailTo(destination.id)}
              >
                {destination.label}
              </button>
            ))}
          </nav>

          <div className="v4-chart" aria-hidden="true">
            <svg viewBox={`${CHART.minX} ${CHART.minZ} ${CHART.maxX - CHART.minX} ${CHART.maxZ - CHART.minZ}`}>
              {places.map((place) => {
                const radius = Math.max(2.4, ...place.colliders.map((collider) => collider[2]));
                const isActive = zone === place.id;
                return (
                  <g key={place.id} className="v4-chart__place" data-active={isActive || undefined} onClick={() => sailTo(place.id)}>
                    {place.kind === "signal" ? (
                      <rect x={place.x - 24} y={place.z - 3.5} width={48} height={7} rx={2} />
                    ) : place.kind === "stack" ? (
                      <circle cx={place.x} cy={place.z} r={12} className="v4-chart__lagoon" />
                    ) : place.kind === "home" ? (
                      <rect x={place.x - 14} y={place.z - 3.5} width={28} height={7} rx={3.5} />
                    ) : (
                      <circle cx={place.x} cy={place.z} r={Math.min(radius, 10)} />
                    )}
                    {chartLabels.has(place.id) && (
                      <text x={place.x} y={place.z + (place.kind === "stack" ? 18 : Math.min(radius, 10) + 9)}>
                        {destinations.find((destination) => destination.id === place.id)?.label}
                      </text>
                    )}
                  </g>
                );
              })}
              <g ref={boatRef} className="v4-chart__boat">
                <path d="M0 -5 L3.4 4 L0 2.4 L-3.4 4 Z" />
              </g>
            </svg>
          </div>

          <div className="v4-zoom" role="group" aria-label="Zoom">
            <button type="button" onClick={() => engineRef.current?.zoom(0.85)} aria-label="Zoom in"><Plus size={16} aria-hidden="true" /></button>
            <button type="button" onClick={() => engineRef.current?.zoom(1.18)} aria-label="Zoom out"><Minus size={16} aria-hidden="true" /></button>
          </div>

          <p className="v4-hint">
            <span className="v4-hint--fine">Click the water to sail · WASD / arrows to steer · scroll to zoom</span>
            <span className="v4-hint--touch">Tap the water to sail · pinch to zoom</span>
          </p>
        </>
      )}

      <p className="v4-sr" aria-live="polite">{sailing && here ? `Moored at ${here.label}.` : ""}</p>

      <main id="main-content" className="v4-panels">{children}</main>
    </div>
  );
}
