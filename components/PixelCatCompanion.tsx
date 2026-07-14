"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type CatPosition = { x: number; y: number; facing: 1 | -1 };
type TravelMode = "idle" | "walking" | "jumping";
type CatPose = "idle" | "crouch" | "launch" | "airborne" | "fall" | "land" | "walk" | "sleep" | "wake";

const PERCH_OFFSETS = [0.14, 0.82, 0.25, 0.72, 0.38];
const WALK_DURATION_SECONDS = 2.4;
const JUMP_DURATION_SECONDS = 1.8;

function getSpriteFrame(pose: CatPose, tick: number) {
  if (pose === "walk") return { column: tick % 8, row: 0, groundOffset: 0 };
  if (pose === "crouch") return { column: 0, row: 1, groundOffset: 6.3 };
  if (pose === "launch") return { column: 1, row: 1, groundOffset: 1.8 };
  if (pose === "airborne") return { column: 2 + (tick % 3), row: 1, groundOffset: 0 };
  if (pose === "fall") return { column: 5, row: 1, groundOffset: 0 };
  if (pose === "land") return { column: 6 + (tick % 2), row: 1, groundOffset: 6.8 };
  if (pose === "sleep") return { column: 2 + (tick % 3), row: 2, groundOffset: 23.4 };
  if (pose === "wake") return { column: 5 + (tick % 3), row: 2, groundOffset: 23.4 };
  return { column: tick % 8, row: 3, groundOffset: 32 };
}

function SpriteCat({ pose, tick }: { pose: CatPose; tick: number }) {
  const frame = getSpriteFrame(pose, tick);
  return (
    <span
      className="pixel-cat-sprite"
      role="img"
      aria-label="A cute animated black pixel cat"
      style={{
        backgroundPosition: `${(frame.column / 7) * 100}% ${(frame.row / 3) * 100}%`,
        transform: `translateY(${frame.groundOffset}%)`,
      }}
    />
  );
}

export function PixelCatCompanion() {
  const prefersReducedMotion = useReducedMotion();
  const pointsRef = useRef<CatPosition[]>([]);
  const currentPointRef = useRef(0);
  const currentPositionRef = useRef<CatPosition>({ x: -80, y: 100, facing: 1 });
  const animationTimersRef = useRef<number[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [frameTick, setFrameTick] = useState(0);
  const [travelMode, setTravelMode] = useState<TravelMode>("idle");
  const [pose, setPose] = useState<CatPose>("idle");
  const [actionDuration, setActionDuration] = useState(0.8);
  const [position, setPosition] = useState<CatPosition>({ x: -80, y: 100, facing: 1 });
  const [jumpOrigin, setJumpOrigin] = useState<CatPosition>({ x: -80, y: 100, facing: 1 });

  useEffect(() => {
    let isCancelled = false;
    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        animationTimersRef.current = animationTimersRef.current.filter((id) => id !== timer);
        if (!isCancelled) callback();
      }, delay);
      animationTimersRef.current.push(timer);
    };

    const readPath = () => {
      const zoom = Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
      const perches = [...document.querySelectorAll<HTMLElement>("[data-cat-perch]")];
      pointsRef.current = perches.map((perch, index) => {
        const rect = perch.getBoundingClientRect();
        const isHero = perch.dataset.catKind === "hero";
        const isButton = perch.dataset.catKind === "button";
        const offset = isHero ? 0.62 : isButton ? 0.5 : PERCH_OFFSETS[index % PERCH_OFFSETS.length];
        return {
          x: (rect.left + window.scrollX + rect.width * offset - 32) / zoom,
          y: (rect.top + window.scrollY - 50) / zoom,
          facing: 1,
        };
      });
    };

    const moveTo = (pointIndex: number, requestedMode?: "walk" | "jump") => {
      const baseTarget = pointsRef.current[pointIndex];
      if (!baseTarget) return;
      const origin = currentPositionRef.current;
      const facing: 1 | -1 = baseTarget.x >= origin.x ? 1 : -1;
      const target = { ...baseTarget, facing };
      const mode = requestedMode ?? (Math.abs(target.y - origin.y) < 48 ? "walk" : "jump");
      currentPointRef.current = pointIndex;
      currentPositionRef.current = target;

      if (prefersReducedMotion) {
        setPosition(target);
        setPose("idle");
        setTravelMode("idle");
        return;
      }
      if (mode === "walk") {
        setActionDuration(WALK_DURATION_SECONDS);
        setPosition(target);
        setPose("walk");
        setTravelMode("walking");
        schedule(() => { setPose("idle"); setTravelMode("idle"); }, 2450);
        return;
      }

      const orientedOrigin = { ...origin, facing };
      setJumpOrigin(orientedOrigin);
      setPosition(orientedOrigin);
      setPose("crouch");
      setTravelMode("idle");
      schedule(() => {
        setActionDuration(JUMP_DURATION_SECONDS);
        setPosition(target);
        setPose("launch");
        setTravelMode("jumping");
      }, 400);
      schedule(() => setPose("airborne"), 760);
      schedule(() => setPose("fall"), 1550);
      schedule(() => { setPose("land"); setTravelMode("idle"); }, 2200);
      schedule(() => setPose("idle"), 2800);
    };

    const startCycle = () => {
      if (isCancelled || pointsRef.current.length < 4) return;
      schedule(() => moveTo(1, "walk"), 1500);
      schedule(() => moveTo(2, "walk"), 5000);
      schedule(() => moveTo(3, "jump"), 8500);
      schedule(() => setPose("sleep"), 12000);
      schedule(() => setPose("wake"), 24000);
      schedule(() => setPose("idle"), 25800);
      schedule(() => moveTo(4), 27000);
      schedule(() => moveTo(5), 31500);
      schedule(() => moveTo(6), 36000);
      schedule(() => moveTo(7), 40500);
      schedule(() => moveTo(8), 45000);
      schedule(() => setPose("sleep"), 48000);
      schedule(() => setPose("wake"), 60000);
      schedule(() => setPose("idle"), 61800);
      schedule(() => moveTo(0, "jump"), 63000);
      schedule(startCycle, 67500);
    };

    const initialize = async () => {
      await document.fonts.ready;
      if (isCancelled) return;
      readPath();
      const firstPoint = pointsRef.current[0];
      if (!firstPoint) return;
      currentPositionRef.current = firstPoint;
      setPosition(firstPoint);
      setJumpOrigin(firstPoint);
      setIsReady(true);
      startCycle();
    };
    const onResize = () => {
      readPath();
      const target = pointsRef.current[currentPointRef.current];
      if (target) {
        currentPositionRef.current = target;
        setPosition(target);
      }
    };

    window.addEventListener("resize", onResize);
    void initialize();
    return () => {
      isCancelled = true;
      window.removeEventListener("resize", onResize);
      animationTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      animationTimersRef.current = [];
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    setFrameTick(0);
    if (prefersReducedMotion) return;
    const frameDuration = pose === "sleep" ? 900 : pose === "idle" ? 360 : pose === "wake" ? 420 : pose === "walk" ? 210 : 280;
    const timer = window.setInterval(() => setFrameTick((frame) => frame + 1), frameDuration);
    return () => window.clearInterval(timer);
  }, [pose, prefersReducedMotion]);

  const isArcJump = travelMode === "jumping" && !prefersReducedMotion;
  const jumpPeak = Math.min(jumpOrigin.y, position.y) - 54;
  const animatedPosition = isArcJump
    ? {
        x: [jumpOrigin.x, (jumpOrigin.x + position.x) / 2, position.x],
        y: [jumpOrigin.y, jumpPeak, position.y],
        rotate: [0, -7 * position.facing, 0],
      }
    : { x: position.x, y: position.y, rotate: 0 };

  return (
    <motion.div
      aria-hidden="true"
      className={`pixel-cat-companion ${isReady ? "pixel-cat-companion--ready" : ""} pixel-cat-companion--${travelMode} pixel-cat-companion--pose-${pose} pixel-cat-companion--facing-${position.facing === 1 ? "right" : "left"}`}
      initial={false}
      animate={animatedPosition}
      transition={prefersReducedMotion ? { duration: 0 } : isArcJump ? { duration: actionDuration, times: [0, 0.38, 1], ease: "easeInOut" } : travelMode === "walking" ? { duration: actionDuration, ease: "easeInOut" } : { duration: 0.12 }}
    >
      <span className="pixel-cat-heart">♥</span>
      <span className="pixel-cat-zzz">Zzz</span>
      <span className="pixel-cat-speech">Hire me!</span>
      <span className="pixel-cat-facing"><SpriteCat pose={pose} tick={frameTick} /></span>
    </motion.div>
  );
}
