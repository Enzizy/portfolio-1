"use client";

import { ArrowLeft, ArrowRight, Cat, Keyboard, LetterText } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DailyWord } from "./DailyWord";
import { TypingSprint } from "./TypingSprint";
import { useArcadeRecords } from "./useArcadeRecords";

type Game = "typing" | "word";

const games = [
  { id: "typing", number: "01", title: "Typing Sprint", description: "Race the clock. Watch your speed and accuracy climb.", detail: "30 or 60 seconds", icon: Keyboard },
  { id: "word", number: "02", title: "Five-Letter Guess", description: "One word each day. Six attempts to find it.", detail: "New puzzle daily", icon: LetterText },
  { id: "runner", number: "03", title: "Cat Runner", description: "Jump over obstacles and collect gems with the portfolio cat.", detail: "Endless run", icon: Cat },
] as const;

export function ArcadeHub() {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const records = useArcadeRecords();

  const openGame = useCallback((id: (typeof games)[number]["id"]) => {
    if (id === "runner") {
      window.dispatchEvent(new Event("portfolio:open-game"));
      return;
    }
    window.history.replaceState(null, "", `#${id}`);
    setActiveGame(id);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash !== "typing" && hash !== "word") return;
    const frame = window.requestAnimationFrame(() => setActiveGame(hash));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!activeGame) return;
    const frame = window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "instant", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [activeGame]);

  // An arcade should take a coin without a mouse: 1, 2 and 3 start a cabinet.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;
      const index = Number(event.key);
      if (!Number.isInteger(index) || index < 1 || index > games.length) return;
      event.preventDefault();
      openGame(games[index - 1].id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openGame]);

  function closeGame() {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setActiveGame(null);
  }

  const scoreFor = (id: (typeof games)[number]["id"]) => {
    if (id === "typing") return records.typingBest ? { label: "Personal best", value: `${records.typingBest} WPM` } : null;
    if (id === "word") {
      if (records.wordSolved) return { label: "Today", value: `Solved in ${records.wordGuesses}` };
      if (records.wordPlayed) return { label: "Today", value: `${records.wordGuesses} of 6 used` };
      return null;
    }
    return null;
  };

  return (
    <div className="arcade-shell">
      <div className="arcade-topline"><Link href="/"><ArrowLeft size={16} aria-hidden="true" /> Back to portfolio</Link><span>PORTFOLIO / ARCADE</span></div>

      <header className="arcade-hero">
        <div>
          <span className="arcade-eyebrow">// A LITTLE OFF THE CLOCK</span>
          <h1>Take a play break<span>.</span></h1>
          <p>Three small games for curious visitors. Pick one, chase a score, and stay as long as you like.</p>
        </div>
        <div className="arcade-hero__meta" aria-hidden="true"><strong>03</strong><span>GAMES TO TRY</span></div>
      </header>

      <div className="arcade-record-board" aria-label="Your records on this device">
        <span><small>BEST TYPING SPEED</small><strong>{records.typingBest ? `${records.typingBest} WPM` : "—"}</strong></span>
        <span><small>TODAY&apos;S WORD</small><strong>{records.wordSolved ? `Solved in ${records.wordGuesses}` : records.wordPlayed ? `${records.wordGuesses} of 6 used` : "Not started"}</strong></span>
        <span><small>SAVED WHERE</small><strong>This browser only</strong></span>
      </div>

      <section className="arcade-collection" aria-labelledby="arcade-games-title">
        <div className="arcade-section-heading">
          <div><span>SELECT A GAME</span><h2 id="arcade-games-title">The lineup</h2></div>
          <p className="arcade-hint">Press <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> to start one</p>
        </div>
        <div className="arcade-grid">
          {games.map(({ id, number, title, description, detail, icon: Icon }, index) => {
            const score = scoreFor(id);
            return (
              <button key={id} className={`arcade-card arcade-card--${id}`} type="button" onClick={() => openGame(id)} aria-label={`Play ${title}`}>
                <span className="arcade-card__top"><span>{number} / 03</span><ArrowRight size={20} aria-hidden="true" /></span>
                <span className="arcade-card__screen" aria-hidden="true">
                  <span className="arcade-card__scanlines" />
                  {id === "runner"
                    ? <span className="arcade-card__cat" />
                    : <Icon size={38} strokeWidth={1.6} aria-hidden="true" />}
                </span>
                <strong>{title}</strong>
                <span className="arcade-card__description">{description}</span>
                <span className="arcade-card__bottom">
                  {score ? <em>{score.label}: {score.value}</em> : detail}
                  <span>PLAY <kbd>{index + 1}</kbd></span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {activeGame && <section ref={panelRef} className="arcade-play-area" aria-labelledby="arcade-current-title">
        <div className="arcade-play-area__heading">
          <div><span className="arcade-eyebrow">NOW PLAYING / {activeGame === "typing" ? "01" : "02"}</span><h2 id="arcade-current-title">{activeGame === "typing" ? "Typing Sprint" : "Five-Letter Guess"}</h2></div>
          <button type="button" onClick={closeGame}>Close game</button>
        </div>
        <div className="arcade-cabinet">
          {activeGame === "typing" ? <TypingSprint /> : <DailyWord />}
        </div>
      </section>}
    </div>
  );
}
