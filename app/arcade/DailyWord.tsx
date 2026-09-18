"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dailyWordFor, scoreGuess, type LetterResult } from "@/lib/arcade";

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const RESULT_RANK: Record<LetterResult, number> = { absent: 1, present: 2, correct: 3 };

export function DailyWord() {
  const [daily, setDaily] = useState<{ date: string; answer: string } | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [message, setMessage] = useState("");
  const boardRef = useRef<HTMLDivElement>(null);
  const loadedDateRef = useRef("");

  useEffect(() => {
    function loadDay() {
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      if (loadedDateRef.current === date) return;
      loadedDateRef.current = date;
      let saved: string[] = [];
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(`arcade-word-${date}`) ?? "[]");
        if (Array.isArray(parsed)) saved = parsed.filter((item): item is string => typeof item === "string" && /^[A-Z]{5}$/.test(item)).slice(0, 6);
      } catch { /* Local storage may be disabled. The puzzle still works. */ }
      setDaily({ date, answer: dailyWordFor(now) });
      setGuesses(saved);
      setCurrent("");
      setMessage("");
    }
    loadDay();
    const timer = window.setInterval(loadDay, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => { if (daily) boardRef.current?.focus(); }, [daily]);

  const won = Boolean(daily && guesses.includes(daily.answer));
  const finished = won || guesses.length >= 6;

  const handleKey = useCallback((key: string) => {
    if (!daily || finished) return;
    if (key === "BACKSPACE") { setCurrent((value) => value.slice(0, -1)); setMessage(""); return; }
    if (key === "ENTER") {
      if (current.length !== 5) { setMessage("Enter five letters first."); return; }
      const nextGuesses = [...guesses, current];
      setGuesses(nextGuesses);
      setCurrent("");
      setMessage("");
      try { localStorage.setItem(`arcade-word-${daily.date}`, JSON.stringify(nextGuesses)); } catch { /* Storage is optional. */ }
      return;
    }
    if (/^[A-Z]$/.test(key) && current.length < 5) { setCurrent((value) => value + key); setMessage(""); }
  }, [current, daily, finished, guesses]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || document.querySelector(".game-overlay") || event.target instanceof HTMLElement && event.target.closest("input, textarea, button, [contenteditable]")) return;
      const key = event.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        event.preventDefault();
        handleKey(key);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const keyResults: Record<string, LetterResult> = {};
  if (daily) guesses.forEach((guess) => scoreGuess(guess, daily.answer).forEach((result, index) => {
    const letter = guess[index];
    if (!keyResults[letter] || RESULT_RANK[result] > RESULT_RANK[keyResults[letter]]) keyResults[letter] = result;
  }));

  async function shareResult() {
    if (!daily) return;
    const grid = guesses.map((guess) => scoreGuess(guess, daily.answer).map((result) => result === "correct" ? "🟦" : result === "present" ? "🟨" : "⬛").join("")).join("\n");
    try {
      await navigator.clipboard.writeText(`Five-Letter Guess ${daily.date} ${won ? guesses.length : "X"}/6\n${grid}\n${window.location.origin}/arcade#word`);
      setMessage("Result copied. The answer stays hidden.");
    } catch { setMessage("Could not copy the result on this browser."); }
  }

  if (!daily) return <div className="arcade-game-loading" role="status">Loading today&apos;s puzzle…</div>;

  return (
    <div className="word-game">
      <div className="word-game__intro"><p>Guess today&apos;s five-letter word in six tries. Blue means the right spot; gold means the letter belongs elsewhere. Any five letters can be entered.</p><span>UTC DAILY / {daily.date}</span></div>
      <div ref={boardRef} className="word-game__board" tabIndex={0} aria-label="Word puzzle. Type on your keyboard or use the keys below.">
        {Array.from({ length: 6 }, (_, row) => {
          const guess = guesses[row];
          const letters = guess ?? (row === guesses.length && !finished ? current : "");
          const feedback = guess ? scoreGuess(guess, daily.answer) : null;
          return <div className="word-game__row" key={row} aria-label={`Guess ${row + 1}: ${guess || letters || "empty"}`}>
            {Array.from({ length: 5 }, (_, column) => <span key={column} className={`word-game__cell${feedback ? ` word-game__cell--${feedback[column]}` : letters[column] ? " word-game__cell--filled" : ""}`} aria-hidden="true">{letters[column] ?? ""}</span>)}
          </div>;
        })}
      </div>
      <div className="word-game__keyboard" aria-label="On-screen keyboard">
        {KEY_ROWS.map((row, index) => <div className="word-game__key-row" key={row}>
          {index === 2 && <button type="button" className="word-game__key word-game__key--wide" onClick={() => { handleKey("ENTER"); boardRef.current?.focus(); }} disabled={finished}>Enter</button>}
          {[...row].map((letter) => <button key={letter} type="button" className={`word-game__key${keyResults[letter] ? ` word-game__key--${keyResults[letter]}` : ""}`} onClick={() => { handleKey(letter); boardRef.current?.focus(); }} disabled={finished}>{letter}</button>)}
          {index === 2 && <button type="button" className="word-game__key word-game__key--wide" onClick={() => { handleKey("BACKSPACE"); boardRef.current?.focus(); }} disabled={finished} aria-label="Backspace">⌫</button>}
        </div>)}
      </div>
      <div className="word-game__result" role="status" aria-live="polite">
        {finished ? <><strong>{won ? `Solved in ${guesses.length} ${guesses.length === 1 ? "try" : "tries"}!` : `Today’s word was ${daily.answer}.`}</strong><span>Come back tomorrow for a new word.</span><button type="button" onClick={shareResult}>Share result</button></> : <span>{message || `${6 - guesses.length} ${6 - guesses.length === 1 ? "guess" : "guesses"} left`}</span>}
        {finished && message && <small>{message}</small>}
      </div>
    </div>
  );
}
