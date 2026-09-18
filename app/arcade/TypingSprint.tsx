"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { wrapTypingLines } from "@/lib/arcade";

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
  const [lineMetrics, setLineMetrics] = useState({ columns: 42, lineHeight: 36 });
  const [catFrame, setCatFrame] = useState<0 | 1 | 2 | 3>(0);
  const bestRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const catTimerRef = useRef<number | null>(null);
  const catStrikeCountRef = useRef(0);
  const nextPawRef = useRef<1 | 2>(1);
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

  useEffect(() => {
    const element = passageRef.current;
    if (!element) return;
    const measure = () => {
      const style = getComputedStyle(element);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const available = element.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
      const columns = Math.max(12, Math.floor(available / context.measureText("M").width));
      const lineHeight = Number.parseFloat(style.lineHeight);
      setLineMetrics((previous) => previous.columns === columns && previous.lineHeight === lineHeight ? previous : { columns, lineHeight });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const frame = window.requestAnimationFrame(measure);
    return () => { observer.disconnect(); window.cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => () => { if (catTimerRef.current) window.clearTimeout(catTimerRef.current); }, []);

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
    if (catTimerRef.current) window.clearTimeout(catTimerRef.current);
    catTimerRef.current = null;
    catStrikeCountRef.current = 0;
    nextPawRef.current = 1;
    setCatFrame(0);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onType(value: string) {
    if (finished) return;
    if (!startedAtRef.current && value.length > 0) { startedAtRef.current = performance.now(); setRunning(true); }
    setTyped(value);
    if (value !== typed) {
      catStrikeCountRef.current += 1;
      if (catStrikeCountRef.current % 6 === 0) setCatFrame(3);
      else {
        setCatFrame(nextPawRef.current);
        nextPawRef.current = nextPawRef.current === 1 ? 2 : 1;
      }
      if (catTimerRef.current) window.clearTimeout(catTimerRef.current);
      catTimerRef.current = window.setTimeout(() => { setCatFrame(0); catTimerRef.current = null; }, 220);
    }
    if (value.length >= prompt.length && startedAtRef.current) finish(value, Math.min(duration, (performance.now() - startedAtRef.current) / 1000));
  }

  const correct = countCorrect(typed, prompt);
  const wpm = elapsed > 0 ? Math.round((correct / 5) / (elapsed / 60)) : 0;
  const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
  const remaining = Math.max(0, duration - Math.floor(elapsed));
  const lines = wrapTypingLines(prompt, lineMetrics.columns);
  const nextLine = lines.findIndex((line) => typed.length < line.end);
  const activeLine = nextLine < 0 ? Math.max(0, lines.length - 1) : nextLine;

  return <div className="typing-game">
    <div className="typing-game__intro"><p>Type the passage below. The timer starts with your first character.</p><div className="typing-game__length" role="group" aria-label="Test length"><button type="button" aria-pressed={duration === 30} onClick={() => reset(30)}>30 sec</button><button type="button" aria-pressed={duration === 60} onClick={() => reset(60)}>60 sec</button></div></div>
    <div className="typing-game__dashboard">
      <div className="typing-game__stats"><span>TIME <strong>{remaining}s</strong></span><span>SPEED <strong>{wpm} WPM</strong></span><span>ACCURACY <strong>{accuracy}%</strong></span><span>PERSONAL BEST <strong>{best} WPM</strong></span></div>
      <div className={`typing-cat typing-cat--frame-${catFrame}`} aria-hidden="true"><span className="typing-cat__sprite" /><small>{catFrame === 3 ? "SMASH!" : catFrame ? "TAP TAP!" : "READY WHEN YOU ARE"}</small></div>
    </div>
    <div ref={passageRef} className="typing-game__passage" style={{ height: lineMetrics.lineHeight * 3 + 40 }} onClick={() => inputRef.current?.focus()}>
      <div className="typing-game__window" aria-hidden="true">
        <div className="typing-game__lines" style={{ transform: `translateY(-${activeLine * lineMetrics.lineHeight}px)` }}>
          {lines.map((line) => <div className="typing-game__line" key={line.start} style={{ height: lineMetrics.lineHeight }}>
            {[...prompt.slice(line.start, line.end)].map((character, offset) => {
              const index = line.start + offset;
              return <span key={index} className={index < typed.length ? character === typed[index] ? "typing-game__char--correct" : "typing-game__char--wrong" : index === typed.length && !finished ? "typing-game__char--current" : undefined}>{character}</span>;
            })}
          </div>)}
        </div>
      </div>
      <label className="sr-only" htmlFor="arcade-typing-input">Type the displayed passage</label>
      <span id="arcade-typing-prompt" className="sr-only">{prompt}</span>
      <textarea ref={inputRef} id="arcade-typing-input" className="typing-game__capture" aria-describedby="arcade-typing-prompt" value={typed} onChange={(event) => onType(event.target.value)} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} disabled={finished} maxLength={prompt.length} autoComplete="off" autoCapitalize="off" spellCheck={false} rows={1} />
    </div>
    <div className="typing-game__footer"><button type="button" onClick={() => reset()}><RotateCcw size={16} aria-hidden="true" /> New sprint</button><p role="status" aria-live="polite">{finished ? `Sprint complete: ${wpm} WPM at ${accuracy}% accuracy.` : "Correct letters count toward your speed. Fix mistakes as you go."}</p></div>
  </div>;
}
