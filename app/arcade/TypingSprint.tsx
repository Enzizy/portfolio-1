"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const PROMPTS = [
  "The little things make a place memorable. A warm light in the window, the sound of rain against the roof, and a good story told at just the right time can turn an ordinary evening into something worth keeping. Take your time, find your rhythm, and let the words arrive one after another. There is no perfect score to chase here; the fun is in seeing how far you can go before the clock runs out. If your fingers get ahead of your thoughts, slow down for a moment and begin again with a steady pace.",
  "Every great adventure starts with a small decision. You might follow a winding road, open a dusty book, or simply ask a question that nobody else thought to ask. The world is full of details waiting to be noticed. Look for patterns, trust your curiosity, and keep moving even when the next step is not obvious. A little patience can reveal a surprising path through a difficult problem. And sometimes the best discovery is the one you never planned to make.",
  "Somewhere between the first sketch and the finished idea, a new possibility appears. You try a shape, move a line, change a color, and suddenly the whole thing feels different. Progress rarely travels in a straight line. It grows through experiments, wrong turns, and the choice to try once more. That is what makes building things interesting: each small improvement teaches you something the original plan could not. Keep the useful parts, leave the rest, and enjoy the work in front of you.",
];

function countCorrect(value: string, prompt: string) {
  return [...value].reduce((count, character, index) => count + Number(character === prompt[index]), 0);
}

export function TypingSprint() {
  const [duration, setDuration] = useState<30 | 60>(30);
  const [promptIndex, setPromptIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState(0);
  const bestRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prompt = PROMPTS[promptIndex];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = Number.parseInt(localStorage.getItem("arcade-typing-best") ?? "0", 10) || 0;
        bestRef.current = saved;
        setBest(saved);
      } catch { /* Best score is optional. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const finish = useCallback((value: string, seconds: number) => {
    setRunning(false);
    setFinished(true);
    setElapsed(seconds);
    const wpm = Math.round((countCorrect(value, prompt) / 5) / (Math.max(seconds, 1) / 60));
    const nextBest = Math.max(bestRef.current, wpm);
    bestRef.current = nextBest;
    setBest(nextBest);
    try { localStorage.setItem("arcade-typing-best", String(nextBest)); } catch { /* Best score is optional. */ }
  }, [prompt]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const seconds = Math.min(duration, (performance.now() - (startedAtRef.current ?? performance.now())) / 1000);
      if (seconds >= duration) finish(typed, duration);
      else setElapsed(seconds);
    }, 100);
    return () => window.clearInterval(timer);
  }, [duration, finish, running, typed]);

  function reset(nextDuration: 30 | 60 = duration) {
    setDuration(nextDuration);
    setPromptIndex((index) => (index + 1) % PROMPTS.length);
    setTyped("");
    setElapsed(0);
    setRunning(false);
    setFinished(false);
    startedAtRef.current = null;
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onType(value: string) {
    if (finished) return;
    if (!startedAtRef.current && value.length > 0) { startedAtRef.current = performance.now(); setRunning(true); }
    setTyped(value);
    if (value.length >= prompt.length && startedAtRef.current) finish(value, Math.min(duration, (performance.now() - startedAtRef.current) / 1000));
  }

  const correct = countCorrect(typed, prompt);
  const wpm = elapsed > 0 ? Math.round((correct / 5) / (elapsed / 60)) : 0;
  const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
  const remaining = Math.max(0, duration - Math.floor(elapsed));

  return <div className="typing-game">
    <div className="typing-game__intro"><p>Type the passage below. The timer starts with your first character.</p><div className="typing-game__length" role="group" aria-label="Test length"><button type="button" aria-pressed={duration === 30} onClick={() => reset(30)}>30 sec</button><button type="button" aria-pressed={duration === 60} onClick={() => reset(60)}>60 sec</button></div></div>
    <div className="typing-game__stats"><span>TIME <strong>{remaining}s</strong></span><span>SPEED <strong>{wpm} WPM</strong></span><span>ACCURACY <strong>{accuracy}%</strong></span><span>PERSONAL BEST <strong>{best} WPM</strong></span></div>
    <div className="typing-game__passage" aria-label="Text to type">{[...prompt].map((character, index) => <span key={index} className={index < typed.length ? character === typed[index] ? "typing-game__char--correct" : "typing-game__char--wrong" : index === typed.length && !finished ? "typing-game__char--current" : undefined}>{character}</span>)}</div>
    <label className="typing-game__input-label" htmlFor="arcade-typing-input">Your typing</label>
    <textarea ref={inputRef} id="arcade-typing-input" value={typed} onChange={(event) => onType(event.target.value)} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} disabled={finished} maxLength={prompt.length} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Start typing here…" rows={3} />
    <div className="typing-game__footer"><button type="button" onClick={() => reset()}><RotateCcw size={16} aria-hidden="true" /> New sprint</button><p role="status" aria-live="polite">{finished ? `Sprint complete: ${wpm} WPM at ${accuracy}% accuracy.` : "Correct letters count toward your speed. Fix mistakes as you go."}</p></div>
  </div>;
}
