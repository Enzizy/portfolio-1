"use client";

import { ArrowLeft, ArrowRight, Cat, Keyboard, LetterText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { DailyWord } from "./DailyWord";
import { TypingSprint } from "./TypingSprint";

type Game = "typing" | "word";

const games = [
  { id: "typing", number: "01", title: "Typing Sprint", description: "Race the clock. Watch your speed and accuracy climb.", detail: "30 or 60 seconds", icon: Keyboard },
  { id: "word", number: "02", title: "Five-Letter Guess", description: "One word each day. Six attempts to find it.", detail: "New puzzle daily", icon: LetterText },
  { id: "runner", number: "03", title: "Cat Runner", description: "Jump over obstacles and collect gems with the portfolio cat.", detail: "Endless run", icon: Cat },
] as const;

export function ArcadeHub() {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  function openGame(id: (typeof games)[number]["id"]) {
    if (id === "runner") {
      window.dispatchEvent(new Event("portfolio:open-game"));
      return;
    }
    setActiveGame(id);
    window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="arcade-shell">
      <div className="arcade-topline"><Link href="/"><ArrowLeft size={16} aria-hidden="true" /> Back to portfolio</Link><span>ZH / 001 — PLAYGROUND</span></div>
      <header className="arcade-hero">
        <div><span className="arcade-eyebrow"><Sparkles size={14} aria-hidden="true" /> A little off the clock</span><h1>Take a<br /><em>play break.</em></h1><p>Three small games for curious visitors. Pick one, chase a score, and stay as long as you like.</p></div>
        <div className="arcade-hero__badge" aria-hidden="true"><span>PLAY</span><span>↗</span><small>03 / GAMES</small></div>
      </header>

      <section className="arcade-collection" aria-labelledby="arcade-games-title">
        <div className="arcade-section-heading"><span>SELECT A GAME</span><h2 id="arcade-games-title">The lineup</h2></div>
        <div className="arcade-grid">
          {games.map(({ id, number, title, description, detail, icon: Icon }) => (
            <button key={id} className="arcade-card" type="button" onClick={() => openGame(id)} aria-label={`Play ${title}`}>
              <span className="arcade-card__top"><span>{number} / 03</span><ArrowRight size={20} aria-hidden="true" /></span>
              <span className="arcade-card__icon"><Icon size={34} strokeWidth={1.7} aria-hidden="true" /></span>
              <strong>{title}</strong><span className="arcade-card__description">{description}</span>
              <span className="arcade-card__bottom">{detail}<span>PLAY NOW ↗</span></span>
            </button>
          ))}
        </div>
      </section>

      {activeGame && <section ref={panelRef} className="arcade-play-area" aria-labelledby="arcade-current-title">
        <div className="arcade-play-area__heading"><div><span className="arcade-eyebrow">NOW PLAYING / {activeGame === "typing" ? "01" : "02"}</span><h2 id="arcade-current-title">{activeGame === "typing" ? "Typing Sprint" : "Five-Letter Guess"}</h2></div><button type="button" onClick={() => setActiveGame(null)}>Close game</button></div>
        {activeGame === "typing" ? <TypingSprint /> : <DailyWord />}
      </section>}
    </div>
  );
}
