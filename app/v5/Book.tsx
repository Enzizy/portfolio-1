"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlignLeft, ArrowLeft, ArrowRight, BookOpen, Mail, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PortfolioVersionSwitch } from "@/components/PortfolioVersionSwitch";
import type { BookData, BookFonts } from "./_book/content";
import type { BookScene } from "./_book/scene";

type Phase = "loading" | "ready" | "failed";
type View = "book" | "text";

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

/** Which spread shows a given page (0-based, pages alternate right, left, right…). */
const spreadOf = (pageIndex: number) => Math.floor(pageIndex / 2) + 1 + (pageIndex % 2);

/**
 * The V5 shell: a full-screen desk with the book on it, a small HUD around it, and
 * the same content as plain text for screen readers, search engines, and anyone
 * who would rather read than turn pages.
 */
export function Book({ className, fonts, data, children }: { className: string; fonts: BookFonts; data: BookData; children: ReactNode }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BookScene | null>(null);
  const contactSpread = useRef(1);
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState<View>("book");
  const [muted, setMuted] = useState(false);
  const [spread, setSpread] = useState({ index: 0, total: 1, label: "Closed" });

  const navigate = useCallback(
    (href: string) => {
      if (href.startsWith("http")) window.open(href, "_blank", "noopener,noreferrer");
      else if (href.startsWith("mailto:") || href.endsWith(".pdf")) window.location.href = href;
      else router.push(href);
    },
    [router],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let scene: BookScene | null = null;

    const boot = async () => {
      try {
        if (!supportsWebGL()) throw new Error("WebGL is unavailable");
        // Pages are typeset on canvases, so their fonts must be ready first.
        await Promise.race([
          Promise.all([
            document.fonts.load(`400 40px ${fonts.serif}`),
            document.fonts.load(`italic 400 40px ${fonts.serif}`),
            document.fonts.load(`400 18px ${fonts.sans}`),
            document.fonts.load(`600 18px ${fonts.sans}`),
            document.fonts.load(`500 13px ${fonts.mono}`),
          ]),
          new Promise((resolve) => window.setTimeout(resolve, 3000)),
        ]);
        const [{ buildBook, imageSources, loadImages }, { createBookScene }] = await Promise.all([import("./_book/content"), import("./_book/scene")]);
        const images = await loadImages(imageSources(), (done, total) => !disposed && setProgress(done / total));
        if (disposed) return;
        const small = window.innerWidth < 900 || window.matchMedia("(pointer: coarse)").matches;
        const { pages, covers } = buildBook(fonts, images, data, small ? 768 : 1152);
        contactSpread.current = spreadOf(Math.max(0, pages.findIndex((page) => page.label === "Contact")));
        scene = createBookScene({
          canvas,
          pages,
          covers,
          onSpread: (index, total, label) => setSpread({ index, total, label }),
          onNavigate: navigate,
        });
        sceneRef.current = scene;
        setPhase("ready");
      } catch (error) {
        console.warn("[v5] falling back to the text edition:", error);
        if (!disposed) {
          setPhase("failed");
          setView("text");
        }
      }
    };
    boot();

    return () => {
      disposed = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [data, fonts, navigate]);

  useEffect(() => {
    sceneRef.current?.setPaused(view === "text");
    if (view === "text") window.scrollTo({ top: 0 });
  }, [view]);

  const open = spread.index > 0;

  return (
    <div className={`v5-root ${className}`} data-view={view} data-phase={phase} data-open={open || undefined}>
      <div className="v5-stage" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      <div className="v5-vignette" aria-hidden="true" />

      <header className="v5-top">
        <div className="v5-top__brand">
          <Link href="/" className="v5-mark" aria-label="Zhyronne Batican, version 1">
            <i aria-hidden="true" />ZB.
          </Link>
          <PortfolioVersionSwitch version={5} />
        </div>
        <div className="v5-top__actions">
          {view === "book" && phase === "ready" && (
            <button
              type="button"
              className="v5-chip v5-chip--icon"
              aria-pressed={!muted}
              aria-label={muted ? "Turn page sounds on" : "Turn page sounds off"}
              onClick={() => {
                sceneRef.current?.setMuted(!muted);
                setMuted(!muted);
              }}
            >
              {muted ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
            </button>
          )}
          {phase !== "failed" && (
            <button type="button" className="v5-chip" onClick={() => setView(view === "book" ? "text" : "book")}>
              {view === "book" ? <AlignLeft size={14} aria-hidden="true" /> : <BookOpen size={14} aria-hidden="true" />}
              {view === "book" ? "Read as text" : "Back to the book"}
            </button>
          )}
          <button
            type="button"
            className="v5-chip v5-chip--solid"
            onClick={() => {
              if (view === "book" && sceneRef.current) sceneRef.current.goTo(contactSpread.current);
              else document.getElementById("v5-contact")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Mail size={14} aria-hidden="true" /> Get in touch
          </button>
        </div>
      </header>

      {view === "book" && (
        <>
          <div className="v5-intro" data-hidden={open || undefined}>
            <p className="v5-intro__title">
              An interactive portfolio
              <br />
              you can leaf through
            </p>
            <p className="v5-intro__sub">
              {phase === "loading"
                ? `Setting out the desk… ${Math.round(progress * 100)}%`
                : "Open the book, then take hold of a page and drag it over — or just click. Hover a project to see it in motion."}
            </p>
          </div>

          {open && (
            <nav className="v5-pager" aria-label="Pages">
              <button type="button" onClick={() => sceneRef.current?.prev()} aria-label="Previous page">
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
              <p aria-live="polite">
                <span>{String(spread.index).padStart(2, "0")} / {String(spread.total).padStart(2, "0")}</span>
                {spread.label}
              </p>
              <button type="button" onClick={() => sceneRef.current?.next()} aria-label="Next page">
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button type="button" className="v5-pager__close" onClick={() => sceneRef.current?.close()} aria-label="Close the book">
                <X size={16} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}

      <main id="main-content" className="v5-text">{children}</main>
    </div>
  );
}
