"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, Sprout, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type GameStatus = "ready" | "playing" | "paused" | "lost";
type Obstacle = { id: number; x: number; kind: "plant" | "rock" };
type Collectible = { id: number; x: number; y: number };
type RunnerWorld = {
  status: GameStatus;
  catY: number;
  velocityY: number;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  distance: number;
  bonus: number;
  speed: number;
  spawnIn: number;
  nextId: number;
};

const CAT_LEFT = 18;
const CAT_RIGHT = 25;
const BASE_SPEED = 34;
const GRAVITY = 1050;
const JUMP_VELOCITY = 430;

function createWorld(status: GameStatus = "ready"): RunnerWorld {
  return {
    status,
    catY: 0,
    velocityY: 0,
    obstacles: [],
    collectibles: [],
    distance: 0,
    bonus: 0,
    speed: BASE_SPEED,
    spawnIn: 1.35,
    nextId: 1,
  };
}

function getScore(world: RunnerWorld) {
  return Math.floor(world.distance) + world.bonus;
}

export function ArcadeGame({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const worldRef = useRef<RunnerWorld>(createWorld());
  const lastFrameRef = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [game, setGame] = useState<RunnerWorld>(() => createWorld());
  const [bestScore, setBestScore] = useState(0);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const publishWorld = useCallback(() => {
    setGame({
      ...worldRef.current,
      obstacles: [...worldRef.current.obstacles],
      collectibles: [...worldRef.current.collectibles],
    });
  }, []);

  const restartGame = useCallback((startImmediately = false) => {
    worldRef.current = createWorld(startImmediately ? "playing" : "ready");
    if (startImmediately) worldRef.current.velocityY = JUMP_VELOCITY;
    lastFrameRef.current = performance.now();
    publishWorld();
  }, [publishWorld]);

  const jump = useCallback(() => {
    const world = worldRef.current;
    if (world.status === "lost") {
      restartGame(true);
      return;
    }
    if (world.status === "ready") world.status = "playing";
    if (world.status !== "playing" || world.catY > 2) return;
    world.velocityY = JUMP_VELOCITY;
    lastFrameRef.current = performance.now();
    publishWorld();
  }, [publishWorld, restartGame]);

  const togglePause = useCallback(() => {
    const world = worldRef.current;
    if (world.status === "lost") return;
    world.status = world.status === "playing" ? "paused" : "playing";
    lastFrameRef.current = performance.now();
    publishWorld();
  }, [publishWorld]);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    setBestScore(Number.parseInt(localStorage.getItem("cat-runner-best") ?? "0", 10) || 0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      if ([" ", "ArrowUp", "w", "W"].includes(event.key)) {
        event.preventDefault();
        jump();
      }
      if (event.key === "p" || event.key === "P") togglePause();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, jump, onClose, togglePause]);

  useEffect(() => {
    if (!isOpen || game.status !== "playing") return;
    let animationFrame = 0;
    lastFrameRef.current = performance.now();

    const update = (now: number) => {
      const world = worldRef.current;
      if (world.status !== "playing") return;
      const deltaTime = Math.min((now - lastFrameRef.current) / 1000, 0.034);
      lastFrameRef.current = now;

      world.speed = BASE_SPEED + Math.min(22, world.distance / 155);
      world.distance += world.speed * deltaTime;
      world.velocityY -= GRAVITY * deltaTime;
      world.catY = Math.max(0, world.catY + world.velocityY * deltaTime);
      if (world.catY === 0) world.velocityY = 0;

      world.spawnIn -= deltaTime;
      if (world.spawnIn <= 0) {
        const obstacleId = world.nextId++;
        const kind = Math.random() > 0.55 ? "rock" : "plant";
        world.obstacles.push({ id: obstacleId, x: 106, kind });
        if (Math.random() > 0.48) {
          world.collectibles.push({ id: world.nextId++, x: 112, y: 54 + Math.random() * 42 });
        }
        const difficultyDelay = Math.max(0.78, 1.32 - world.distance / 950);
        world.spawnIn = difficultyDelay + Math.random() * 0.58;
      }

      world.obstacles.forEach((obstacle) => { obstacle.x -= world.speed * deltaTime; });
      world.collectibles.forEach((collectible) => { collectible.x -= world.speed * deltaTime; });
      world.obstacles = world.obstacles.filter((obstacle) => obstacle.x > -12);
      world.collectibles = world.collectibles.filter((collectible) => {
        const wasCollected = collectible.x >= CAT_LEFT && collectible.x <= CAT_RIGHT
          && Math.abs(world.catY + 25 - collectible.y) < 30;
        if (wasCollected) world.bonus += 100;
        return !wasCollected && collectible.x > -8;
      });

      const crashed = world.obstacles.some((obstacle) => {
        const obstacleHeight = obstacle.kind === "rock" ? 32 : 29;
        return obstacle.x >= CAT_LEFT && obstacle.x <= CAT_RIGHT && world.catY < obstacleHeight - 5;
      });
      if (crashed) {
        world.status = "lost";
        const score = getScore(world);
        setBestScore((currentBest) => {
          const nextBest = Math.max(currentBest, score);
          localStorage.setItem("cat-runner-best", String(nextBest));
          return nextBest;
        });
        publishWorld();
        return;
      }

      publishWorld();
      animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [game.status, isOpen, publishWorld]);

  const score = getScore(game);
  const speedLabel = `${(game.speed / BASE_SPEED).toFixed(1)}x`;
  const runFrame = Math.floor(game.distance / 2) % 8;

  if (!portalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div className="game-overlay" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <motion.div className="game-dialog runner-dialog" role="dialog" aria-modal="true" aria-labelledby="game-title" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.22 }}>
            <header className="game-header">
              <div><span>// MINI ARCADE</span><h2 id="game-title">CAT RUNNER</h2><p>Chase the horizon</p></div>
              <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close game"><X size={20} /></button>
            </header>

            <div className="runner-stats" aria-live="polite">
              <span>Score <b>{score.toString().padStart(5, "0")}</b></span>
              <span>Best <b>{bestScore.toString().padStart(5, "0")}</b></span>
              <span>Speed <b>{speedLabel}</b></span>
            </div>

            <button className="runner-board" type="button" onClick={jump} aria-label={`Cat runner game. Score ${score}. Tap or press space to jump.`}>
              <span className="runner-cloud runner-cloud--one" />
              <span className="runner-cloud runner-cloud--two" />
              <span className="runner-hill" />
              <span className="runner-cat" style={{ bottom: `${19 + game.catY}px` }}>
                <span className="runner-cat-sprite" style={{ backgroundPosition: `${(runFrame / 7) * 100}% 0` }} />
              </span>
              {game.obstacles.map((obstacle) => (
                <span className={`runner-obstacle runner-obstacle--${obstacle.kind}`} style={{ left: `${obstacle.x}%` }} key={obstacle.id}>
                  {obstacle.kind === "plant" ? <Sprout aria-hidden="true" /> : <i aria-hidden="true" />}
                </span>
              ))}
              {game.collectibles.map((collectible) => <span className="runner-fish" style={{ left: `${collectible.x}%`, bottom: `${collectible.y + 20}px` }} key={collectible.id} aria-hidden="true">◆</span>)}
              <span className="runner-ground" />
              {game.status !== "playing" && (
                <span className="runner-message">
                  <b>{game.status === "lost" ? "RUN TERMINATED" : game.status === "paused" ? "PAUSED" : "READY TO RUN?"}</b>
                  <small>{game.status === "lost" ? `Final score: ${score} · Tap to retry` : game.status === "paused" ? "Press P or Play to continue" : "Tap, Space, or ↑ to jump"}</small>
                </span>
              )}
            </button>

            <div className="game-actions">
              <button type="button" onClick={togglePause} disabled={game.status === "lost"}>{game.status === "playing" ? <Pause size={15} /> : <Play size={15} />}{game.status === "playing" ? "Pause" : "Play"}</button>
              <button type="button" onClick={() => restartGame(false)}><RotateCcw size={15} />Restart</button>
              <button className="runner-jump-button" type="button" onClick={jump}>Jump <span>Space</span></button>
            </div>
            <p className="game-hint">SPACE / ↑ to jump · P to pause · Collect blue gems · Avoid plants and rocks</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot,
  );
}
