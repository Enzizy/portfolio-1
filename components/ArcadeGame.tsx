"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAZE = [
  "###############",
  "#.............#",
  "#.###.###.###.#",
  "#.............#",
  "#.##.#.#.#.##.#",
  "#....#...#....#",
  "###.#.....#.###",
  "#.............#",
  "###.#.###.#.###",
  "#....#...#....#",
  "#.##.#.#.#.##.#",
  "#.............#",
  "###############",
] as const;

type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
type GameStatus = "ready" | "playing" | "paused" | "won" | "lost";
type GameState = {
  player: Point;
  ghosts: Point[];
  pellets: Set<string>;
  direction: Direction | null;
  score: number;
  lives: number;
  status: GameStatus;
};

const START_PLAYER = { x: 1, y: 1 };
const START_GHOSTS = [{ x: 13, y: 11 }, { x: 13, y: 1 }];
const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
  ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
};

function pointKey(point: Point) { return `${point.x}-${point.y}`; }
function isOpen(point: Point) { return MAZE[point.y]?.[point.x] !== "#"; }
function move(point: Point, direction: Direction) {
  const delta = DELTAS[direction];
  const next = { x: point.x + delta.x, y: point.y + delta.y };
  return isOpen(next) ? next : point;
}
function createPellets() {
  const pellets = new Set<string>();
  MAZE.forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell === "." && !(x === START_PLAYER.x && y === START_PLAYER.y)) pellets.add(`${x}-${y}`);
  }));
  return pellets;
}
function createGame(): GameState {
  return { player: START_PLAYER, ghosts: START_GHOSTS, pellets: createPellets(), direction: null, score: 0, lives: 3, status: "ready" };
}
function chooseGhostMove(ghost: Point, player: Point) {
  const options = (Object.keys(DELTAS) as Direction[]).map((direction) => move(ghost, direction)).filter((next) => next !== ghost);
  if (!options.length) return ghost;
  const ranked = options.sort((a, b) => {
    const distanceA = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
    const distanceB = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
    return distanceA - distanceB;
  });
  return Math.random() < 0.58 ? ranked[0] : ranked[Math.floor(Math.random() * ranked.length)];
}

export function ArcadeGame({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [game, setGame] = useState<GameState>(createGame);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cells = useMemo(() => MAZE.flatMap((row, y) => [...row].map((cell, x) => ({ cell, x, y }))), []);

  const resetGame = useCallback(() => setGame(createGame()), []);
  const setDirection = useCallback((direction: Direction) => {
    setGame((current) => ({ ...current, direction, status: current.status === "ready" || current.status === "paused" ? "playing" : current.status }));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      const direction = KEY_DIRECTIONS[event.key];
      if (direction) { event.preventDefault(); setDirection(direction); }
      if (event.key === " ") {
        event.preventDefault();
        setGame((current) => ({ ...current, status: current.status === "playing" ? "paused" : current.status === "paused" || current.status === "ready" ? "playing" : current.status }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [isOpen, onClose, setDirection]);

  useEffect(() => {
    if (!isOpen || game.status !== "playing") return;
    const timer = window.setInterval(() => {
      setGame((current) => {
        if (current.status !== "playing") return current;
        const player = current.direction ? move(current.player, current.direction) : current.player;
        const pellets = new Set(current.pellets);
        const atePellet = pellets.delete(pointKey(player));
        const ghosts = current.ghosts.map((ghost) => chooseGhostMove(ghost, player));
        const wasCaught = ghosts.some((ghost) => pointKey(ghost) === pointKey(player));
        if (wasCaught) {
          const lives = current.lives - 1;
          return { ...current, player: START_PLAYER, ghosts: START_GHOSTS, direction: null, lives, status: lives ? "ready" : "lost" };
        }
        return { ...current, player, ghosts, pellets, score: current.score + (atePellet ? 10 : 0), status: pellets.size ? "playing" : "won" };
      });
    }, 145);
    return () => window.clearInterval(timer);
  }, [game.status, isOpen]);

  const togglePause = () => setGame((current) => ({ ...current, status: current.status === "playing" ? "paused" : current.status === "paused" || current.status === "ready" ? "playing" : current.status }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="game-overlay" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <motion.div className="game-dialog" role="dialog" aria-modal="true" aria-labelledby="game-title" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.22 }}>
            <header className="game-header">
              <div><span>// MINI ARCADE</span><h2 id="game-title">Dot Chaser</h2></div>
              <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close game"><X size={20} /></button>
            </header>
            <div className="game-stats" aria-live="polite"><span>Score <b>{game.score.toString().padStart(4, "0")}</b></span><span>Lives <b>{"●".repeat(game.lives) || "—"}</b></span></div>
            <div className="game-board" role="application" aria-label={`Dot Chaser game. Score ${game.score}. ${game.lives} lives remaining.`}>
              {cells.map(({ cell, x, y }) => {
                const key = `${x}-${y}`;
                const ghostIndex = game.ghosts.findIndex((ghost) => pointKey(ghost) === key);
                return <div className={`game-cell ${cell === "#" ? "game-wall" : ""}`} key={key}>{game.pellets.has(key) && <i className="game-pellet" />}{pointKey(game.player) === key && <i className={`game-player game-player--${game.direction ?? "right"}`} />}{ghostIndex >= 0 && <i className={`game-ghost game-ghost--${ghostIndex + 1}`} />}</div>;
              })}
              {game.status !== "playing" && <div className="game-message"><b>{game.status === "won" ? "Maze cleared!" : game.status === "lost" ? "Game over" : game.status === "paused" ? "Paused" : "Ready?"}</b><span>{game.status === "ready" ? "Press a direction to start" : game.status === "paused" ? "Press space to continue" : "Nice run!"}</span></div>}
            </div>
            <div className="game-actions"><button type="button" onClick={togglePause} disabled={game.status === "won" || game.status === "lost"}>{game.status === "playing" ? <Pause size={15} /> : <Play size={15} />}{game.status === "playing" ? "Pause" : "Play"}</button><button type="button" onClick={resetGame}><RotateCcw size={15} />Restart</button></div>
            <div className="game-controls" aria-label="Game controls">
              <button type="button" onClick={() => setDirection("up")} aria-label="Move up"><ArrowUp /></button>
              <button type="button" onClick={() => setDirection("left")} aria-label="Move left"><ArrowLeft /></button>
              <button type="button" onClick={() => setDirection("down")} aria-label="Move down"><ArrowDown /></button>
              <button type="button" onClick={() => setDirection("right")} aria-label="Move right"><ArrowRight /></button>
            </div>
            <p className="game-hint">Use arrow keys or WASD · Space to pause</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
