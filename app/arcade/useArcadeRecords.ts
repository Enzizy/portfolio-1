"use client";

import { useSyncExternalStore } from "react";
import { dailyWordFor, scoreGuess } from "@/lib/arcade";

export type ArcadeRecords = {
  /** Best typing speed ever recorded on this device, in words per minute. */
  typingBest: number;
  /** Guesses used on today's word, and whether it has been solved. */
  wordGuesses: number;
  wordSolved: boolean;
  wordPlayed: boolean;
};

const EMPTY: ArcadeRecords = { typingBest: 0, wordGuesses: 0, wordSolved: false, wordPlayed: false };

/*
  The games already write their progress to localStorage; this reads it back so the
  lineup can show a record board. Cached because useSyncExternalStore compares
  snapshots by identity — returning a fresh object each call would loop forever.
*/
let cache: ArcadeRecords = EMPTY;
let cacheKey = "";
const listeners = new Set<() => void>();

function readRecords(): ArcadeRecords {
  if (typeof window === "undefined") return EMPTY;
  const today = new Date();
  const date = today.toISOString().slice(0, 10);

  let typingBest = 0;
  let guesses: string[] = [];
  try {
    typingBest = Number.parseInt(localStorage.getItem("arcade-typing-best") ?? "0", 10) || 0;
    const parsed: unknown = JSON.parse(localStorage.getItem(`arcade-word-${date}`) ?? "[]");
    if (Array.isArray(parsed)) guesses = parsed.filter((item): item is string => typeof item === "string");
  } catch { /* Records are a nicety, not a requirement. */ }

  const answer = dailyWordFor(today);
  const solved = guesses.some((guess) => scoreGuess(guess, answer).every((letter) => letter === "correct"));
  const key = `${typingBest}|${guesses.length}|${solved}|${date}`;
  if (key !== cacheKey) {
    cacheKey = key;
    cache = { typingBest, wordGuesses: guesses.length, wordSolved: solved, wordPlayed: guesses.length > 0 };
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  window.addEventListener("portfolio:arcade-record", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener("portfolio:arcade-record", listener);
  };
}

/** Games call this after writing a result so the lineup updates without a reload. */
export function publishArcadeRecord() {
  window.dispatchEvent(new Event("portfolio:arcade-record"));
}

export function useArcadeRecords() {
  return useSyncExternalStore(subscribe, readRecords, () => EMPTY);
}
