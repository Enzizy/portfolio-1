"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { isCatSoundEnabled, playCatSound, setCatSoundEnabled, startRunnerMusic, unlockCatAudio } from "@/lib/catAudio";
import { CatSprite, getCatFrameDuration, type CatPose } from "./pixel-cat/CatSprite";

type GameStatus = "ready" | "playing" | "paused" | "lost";
type ObstacleKind = "boulder" | "stones" | "plant" | "branch";
type Obstacle = { id: number; x: number; kind: ObstacleKind };
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
  landingFor: number;
  jumpBufferFor: number;
};

const CAT_LEFT = 18;
const CAT_RIGHT = 25;
const BASE_SPEED = 34;
const GRAVITY = 1050;
const JUMP_VELOCITY = 430;
const JUMP_BUFFER_SECONDS = 0.16;

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
    landingFor: 0,
    jumpBufferFor: 0,
  };
}

function getScore(world: RunnerWorld) {
  return Math.floor(world.distance) + world.bonus;
}

export function ArcadeGame({
  isOpen,
  onClose,
  returnFocusRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const worldRef = useRef<RunnerWorld>(createWorld());
  const lastFrameRef = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<RunnerWorld>(() => createWorld());
  const [bestScore, setBestScore] = useState(0);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [catFrame, setCatFrame] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setPortalRoot(document.body);
    setSoundEnabled(isCatSoundEnabled());
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
    if (startImmediately) {
      worldRef.current.velocityY = JUMP_VELOCITY;
      playCatSound("jump");
    }
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
    if (world.status !== "playing") return;
    if (world.catY > 2) {
      world.jumpBufferFor = JUMP_BUFFER_SECONDS;
      return;
    }
    world.landingFor = 0;
    world.jumpBufferFor = 0;
    world.velocityY = JUMP_VELOCITY;
    playCatSound("jump");
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
    setBestScore(Number.parseInt(localStorage.getItem("cat-runner-best") ?? "0", 10) || 0);
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const isControlFocused = Boolean(target?.closest("button, a, input, select, textarea"));
      if (["ArrowUp", "w", "W"].includes(event.key)) {
        event.preventDefault();
        jump();
        return;
      }
      if (event.key === " ") {
        if (isControlFocused && !target?.classList.contains("runner-board")) return;
        event.preventDefault();
        jump();
      }
      if (event.key === "p" || event.key === "P") togglePause();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, jump, togglePause]);

  useDialogFocusTrap(isOpen, dialogRef, closeButtonRef, onClose, returnFocusRef);

  const shouldPlayMusic = isOpen && soundEnabled && game.status !== "lost";
  useEffect(() => {
    if (!shouldPlayMusic) return;
    return startRunnerMusic();
  }, [shouldPlayMusic]);

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
      world.jumpBufferFor = Math.max(0, world.jumpBufferFor - deltaTime);
      const wasAirborne = world.catY > 0;
      world.velocityY -= GRAVITY * deltaTime;
      world.catY = Math.max(0, world.catY + world.velocityY * deltaTime);
      if (world.catY === 0) {
        world.velocityY = 0;
        if (world.jumpBufferFor > 0) {
          world.jumpBufferFor = 0;
          world.landingFor = 0;
          world.velocityY = JUMP_VELOCITY;
          playCatSound("jump");
        } else if (wasAirborne) {
          world.landingFor = 0.26;
        }
      }
      world.landingFor = Math.max(0, world.landingFor - deltaTime);

      world.spawnIn -= deltaTime;
      if (world.spawnIn <= 0) {
        const obstacleId = world.nextId++;
        const obstacleKinds: ObstacleKind[] = ["boulder", "stones", "plant", "branch"];
        const kind = obstacleKinds[Math.floor(Math.random() * obstacleKinds.length)];
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
        if (wasCollected) {
          world.bonus += 100;
          playCatSound("collect");
        }
        return !wasCollected && collectible.x > -8;
      });

      const crashed = world.obstacles.some((obstacle) => {
        const obstacleHeights: Record<ObstacleKind, number> = {
          boulder: 36,
          stones: 31,
          plant: 39,
          branch: 22,
        };
        const obstacleHeight = obstacleHeights[obstacle.kind];
        return obstacle.x >= CAT_LEFT && obstacle.x <= CAT_RIGHT && world.catY < obstacleHeight - 5;
      });
      if (crashed) {
        world.status = "lost";
        playCatSound("crash");
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
  const toggleSound = () => {
    const nextEnabled = !soundEnabled;
    setCatSoundEnabled(nextEnabled);
    setSoundEnabled(nextEnabled);
    if (nextEnabled) void unlockCatAudio();
  };
  const runnerPose: CatPose = game.status === "lost"
    ? "land"
    : game.status !== "playing"
      ? "idle"
      : game.landingFor > 0
        ? "land"
        : game.catY <= 2
          ? "ground-run"
          : game.velocityY > 150
            ? "launch"
            : game.velocityY >= 0
              ? "airborne"
              : "fall";

  useEffect(() => {
    setCatFrame(0);
    const timer = window.setInterval(
      () => setCatFrame((frame) => frame + 1),
      getCatFrameDuration(runnerPose),
    );
    return () => window.clearInterval(timer);
  }, [runnerPose]);

  if (!portalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div className="game-overlay" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <motion.div ref={dialogRef} className="game-dialog runner-dialog" role="dialog" aria-modal="true" aria-labelledby="game-title" tabIndex={-1} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.22 }}>
            <header className="game-header">
              <div><span>// MINI ARCADE</span><h2 id="game-title">CAT RUNNER</h2><p>Chase the horizon</p></div>
              <div className="game-header__actions">
                <button type="button" onClick={toggleSound} aria-label={soundEnabled ? "Mute game sound" : "Turn on game sound"} aria-pressed={soundEnabled} title={soundEnabled ? "Mute sound" : "Turn on sound"}>
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close game"><X size={20} /></button>
              </div>
            </header>

            <div className="runner-stats">
              <span>Score <b>{score.toString().padStart(5, "0")}</b></span>
              <span>Best <b>{bestScore.toString().padStart(5, "0")}</b></span>
              <span>Speed <b>{speedLabel}</b></span>
            </div>

            <p className="sr-only" role="status" aria-live="polite">
              {game.status === "lost" ? `Run ended with a score of ${score}.` : game.status === "paused" ? "Game paused." : game.status === "ready" ? "Game ready." : ""}
            </p>
            <button className={`runner-board runner-board--${game.status}`} type="button" onClick={jump} aria-label="Cat runner play area. Tap or press Space to jump.">
              <span className={`runner-cat runner-cat--${runnerPose}`} style={{ bottom: `${19 + game.catY}px` }} aria-hidden="true">
                <CatSprite pose={runnerPose} tick={catFrame} />
              </span>
              {game.obstacles.map((obstacle) => (
                <span className={`runner-obstacle runner-obstacle--${obstacle.kind}`} style={{ left: `${obstacle.x}%` }} key={obstacle.id} aria-hidden="true" />
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
            <p className="game-hint">SPACE / ↑ to jump · P to pause · Collect blue gems · Avoid rocks, plants, and branches</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot,
  );
}
