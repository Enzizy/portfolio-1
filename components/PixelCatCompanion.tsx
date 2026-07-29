"use client";

import { motion, type Transition, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { DARK_RESTING_RIGHT_OFFSET, JUMP_DURATION_SECONDS, MOBILE_DARK_RESTING_RIGHT_OFFSET, PERCH_OFFSETS, type CatPosition, type TravelMode, type TravelTo, WALK_DURATION_SECONDS } from "./pixel-cat/cat-config";
import { CatCompanionMenu } from "./pixel-cat/CatCompanionMenu";
import { CatSprite, getCatFrameDuration, type CatPose } from "./pixel-cat/CatSprite";

export function PixelCatCompanion() {
  const prefersReducedMotion = useReducedMotion();
  const pointsRef = useRef<CatPosition[]>([]);
  const currentPointRef = useRef(0);
  const currentPositionRef = useRef<CatPosition>({ x: -80, y: 100, facing: 1 });
  const previousDarkModeRef = useRef<boolean | null>(null);
  const darkDockedRef = useRef(false);
  const companionRef = useRef<HTMLDivElement>(null);
  const animationTimersRef = useRef<number[]>([]);
  const reactionTimerRef = useRef<number | null>(null);
  const interactionTimerRef = useRef<number | null>(null);
  const interactionLeaveTimerRef = useRef<number | null>(null);
  const interactionTokenRef = useRef(0);
  const interactionActiveRef = useRef(false);
  const interactionTravelingRef = useRef(false);
  const interactionLockedRef = useRef(false);
  const menuOpenRef = useRef(false);
  const menuScrollPositionRef = useRef({ x: 0, y: 0 });
  const travelToRef = useRef<TravelTo>(() => undefined);
  const [isReady, setIsReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDarkDocked, setIsDarkDocked] = useState(false);
  const [frameTick, setFrameTick] = useState(0);
  const [travelMode, setTravelMode] = useState<TravelMode>("idle");
  const [pose, setPose] = useState<CatPose>("idle");
  const [actionDuration, setActionDuration] = useState(0.8);
  const [position, setPosition] = useState<CatPosition>({ x: -80, y: 100, facing: 1 });
  const [jumpOrigin, setJumpOrigin] = useState<CatPosition>({ x: -80, y: 100, facing: 1 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [interactionPose, setInteractionPose] = useState<CatPose | null>(null);
  const [speechMessage, setSpeechMessage] = useState("Hire me!");

  useEffect(() => {
    try {
      setIsHidden(localStorage.getItem("portfolio-cat-hidden") === "true");
    } catch {
      setIsHidden(false);
    }
  }, []);

  useEffect(() => {
    const toggleCat = () => {
      setIsHidden((hidden) => {
        const nextHidden = !hidden;
        setIsMenuOpen(false);
        try {
          if (nextHidden) localStorage.setItem("portfolio-cat-hidden", "true");
          else localStorage.removeItem("portfolio-cat-hidden");
        } catch {
          // The in-memory preference still applies when storage is unavailable.
        }
        return nextHidden;
      });
    };
    window.addEventListener("portfolio:toggle-cat", toggleCat);
    return () => window.removeEventListener("portfolio:toggle-cat", toggleCat);
  }, []);

  useEffect(() => {
    menuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDarkMode(root.dataset.theme === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const showReaction = useCallback((message: string, duration = 2200, celebrate = false) => {
    if (reactionTimerRef.current) window.clearTimeout(reactionTimerRef.current);
    setSpeechMessage(message);
    setIsReacting(true);
    setIsCelebrating(celebrate);
    reactionTimerRef.current = window.setTimeout(() => {
      setSpeechMessage("Hire me!");
      setIsReacting(false);
      setIsCelebrating(false);
      reactionTimerRef.current = null;
    }, duration);
  }, []);

  useEffect(() => {
    const getProjectTarget = (card: HTMLElement): CatPosition => {
      const zoom = Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
      const rect = card.getBoundingClientRect();
      const perchOffset = rect.left > window.innerWidth * 0.58 ? 0.2 : 0.8;
      return {
        x: (rect.left + window.scrollX + rect.width * perchOffset - 32) / zoom,
        y: (rect.top + window.scrollY - 52) / zoom,
        facing: perchOffset < 0.5 ? 1 : -1,
      };
    };

    const getElementTarget = (element: HTMLElement): CatPosition => {
      const zoom = Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
      const rect = element.getBoundingClientRect();
      return {
        x: (rect.left + window.scrollX + rect.width * 0.5 - 32) / zoom,
        y: (rect.top + window.scrollY - 52) / zoom,
        facing: 1,
      };
    };

    const clearInteractionTimer = () => {
      if (interactionTimerRef.current) window.clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = null;
    };

    const celebrateInteraction = (message: string, duration: number) => {
      if (isDarkMode) return;
      clearInteractionTimer();
      if (interactionLeaveTimerRef.current) window.clearTimeout(interactionLeaveTimerRef.current);
      interactionTokenRef.current += 1;
      interactionActiveRef.current = true;
      interactionLockedRef.current = true;
      setInteractionPose("celebrate");
      showReaction(message, duration, true);
      interactionTimerRef.current = window.setTimeout(() => {
        interactionLockedRef.current = false;
        interactionActiveRef.current = false;
        setInteractionPose(null);
        interactionTimerRef.current = null;
      }, duration);
    };

    const inspectProject = (card: HTMLElement) => {
      if (isDarkMode || interactionLockedRef.current) return;
      if (interactionLeaveTimerRef.current) window.clearTimeout(interactionLeaveTimerRef.current);
      const token = ++interactionTokenRef.current;
      const title = card.dataset.projectTitle ?? "this project";
      interactionActiveRef.current = true;
      setInteractionPose(null);
      showReaction(`Let me inspect ${title}...`, 4400);
      interactionTravelingRef.current = true;
      travelToRef.current(getProjectTarget(card), "jump", () => {
        interactionTravelingRef.current = false;
        if (token !== interactionTokenRef.current || !interactionActiveRef.current) {
          if (!interactionLockedRef.current) interactionActiveRef.current = false;
          return;
        }
        setInteractionPose("inspect");
        showReaction(`${title}: approved!`, 2600);
      });
    };

    const leaveProject = () => {
      if (interactionLockedRef.current) return;
      if (interactionLeaveTimerRef.current) window.clearTimeout(interactionLeaveTimerRef.current);
      interactionLeaveTimerRef.current = window.setTimeout(() => {
        interactionTokenRef.current += 1;
        if (!interactionTravelingRef.current) interactionActiveRef.current = false;
        setInteractionPose(null);
        interactionLeaveTimerRef.current = null;
      }, 650);
    };

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>("[data-project-title]");
      if (!card || card.contains(event.relatedTarget as Node | null)) return;
      inspectProject(card);
    };
    const onPointerOut = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>("[data-project-title]");
      if (!card || card.contains(event.relatedTarget as Node | null)) return;
      leaveProject();
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>("[data-project-title]");
      if (card && !card.contains(event.relatedTarget as Node | null)) inspectProject(card);
    };
    const onFocusOut = (event: FocusEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>("[data-project-title]");
      if (card && !card.contains(event.relatedTarget as Node | null)) leaveProject();
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const project = target?.closest<HTMLElement>("[data-project-title]");
      if (project) {
        celebrateInteraction("Great choice - this way!", 6000);
        const contactPerch = document.querySelector<HTMLElement>('[data-cat-zone="contact"][data-cat-kind="button"]');
        if (contactPerch) travelToRef.current(getElementTarget(contactPerch), "jump");
      } else if (target?.closest('a[href^="mailto:"], a[href*="#contact"]')) {
        celebrateInteraction("Let's build it!", 3000);
      }
      if (!companionRef.current?.contains(target)) setIsMenuOpen(false);
    };

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("click", onClick);
      if (reactionTimerRef.current) window.clearTimeout(reactionTimerRef.current);
      if (interactionTimerRef.current) window.clearTimeout(interactionTimerRef.current);
      if (interactionLeaveTimerRef.current) window.clearTimeout(interactionLeaveTimerRef.current);
    };
  }, [isDarkMode, showReaction]);

  useEffect(() => {
    let isCancelled = false;
    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        animationTimersRef.current = animationTimersRef.current.filter((id) => id !== timer);
        if (!isCancelled) callback();
      }, delay);
      animationTimersRef.current.push(timer);
    };
    const scheduleAutomatic = (callback: () => void, delay: number) => {
      const runWhenMenuClosed = () => {
        if (menuOpenRef.current) {
          schedule(runWhenMenuClosed, 450);
          return;
        }
        callback();
      };
      schedule(runWhenMenuClosed, delay);
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

    const getDarkModeRestingPoint = (fixed = false): CatPosition => {
      const zoom = Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
      const restingRightOffset = window.matchMedia("(max-width: 767px)").matches
        ? MOBILE_DARK_RESTING_RIGHT_OFFSET
        : DARK_RESTING_RIGHT_OFFSET;
      return {
        // The sleeping artwork sits right of center inside its transparent sprite frame.
        x: ((fixed ? 0 : window.scrollX) + window.innerWidth - restingRightOffset) / zoom,
        y: ((fixed ? 0 : window.scrollY) + window.innerHeight - 88) / zoom,
        facing: -1,
      };
    };

    const getRenderedPosition = (): CatPosition => {
      const zoom = Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
      const rect = companionRef.current?.getBoundingClientRect();
      if (!rect) return currentPositionRef.current;
      return {
        x: (rect.left + window.scrollX) / zoom,
        y: (rect.top + window.scrollY) / zoom,
        facing: currentPositionRef.current.facing,
      };
    };

    const jumpToTarget = (baseTarget: CatPosition, onSettled?: () => void, originOverride?: CatPosition, interactive = false) => {
      const origin = originOverride ?? currentPositionRef.current;
      const facing: 1 | -1 = baseTarget.x >= origin.x ? 1 : -1;
      const target = { ...baseTarget, facing };
      const orientedOrigin = { ...origin, facing };
      const canApply = () => interactive || !interactionActiveRef.current;
      currentPositionRef.current = target;
      setJumpOrigin(orientedOrigin);
      setPosition(orientedOrigin);
      setPose("crouch");
      setTravelMode("idle");
      schedule(() => {
        if (!canApply()) return;
        setActionDuration(JUMP_DURATION_SECONDS);
        setPosition(target);
        setPose("launch");
        setTravelMode("jumping");
      }, 400);
      schedule(() => { if (canApply()) setPose("airborne"); }, 760);
      schedule(() => { if (canApply()) setPose("fall"); }, 1550);
      schedule(() => {
        if (!canApply()) return;
        setPose("land");
        setTravelMode("idle");
      }, 2200);
      schedule(() => { if (canApply()) setPose("idle"); }, 2800);
      if (onSettled) schedule(() => { if (canApply()) onSettled(); }, 2880);
    };

    const moveToTarget = (
      baseTarget: CatPosition,
      requestedMode: "walk" | "jump" = "jump",
      onSettled?: () => void,
      originOverride?: CatPosition,
      interactive = false,
    ) => {
      const origin = originOverride ?? currentPositionRef.current;
      const facing: 1 | -1 = baseTarget.x >= origin.x ? 1 : -1;
      const target = { ...baseTarget, facing };
      const mode = requestedMode ?? (Math.abs(target.y - origin.y) < 48 ? "walk" : "jump");

      if (prefersReducedMotion) {
        currentPositionRef.current = target;
        setPosition(target);
        setPose("idle");
        setTravelMode("idle");
        onSettled?.();
        return;
      }
      if (mode === "walk") {
        currentPositionRef.current = target;
        setActionDuration(WALK_DURATION_SECONDS);
        setPosition(target);
        setPose("walk");
        setTravelMode("walking");
        schedule(() => {
          if (!interactive && interactionActiveRef.current) return;
          setPose("idle");
          setTravelMode("idle");
          onSettled?.();
        }, 2450);
        return;
      }

      jumpToTarget(target, onSettled, origin, interactive);
    };

    travelToRef.current = (target, mode = "jump", onSettled) => {
      moveToTarget(target, mode, onSettled, getRenderedPosition(), true);
    };

    const moveTo = (pointIndex: number, requestedMode?: "walk" | "jump") => {
      if (interactionActiveRef.current) return;
      const baseTarget = pointsRef.current[pointIndex];
      if (!baseTarget) return;
      currentPointRef.current = pointIndex;
      const origin = currentPositionRef.current;
      const mode = requestedMode ?? (Math.abs(baseTarget.y - origin.y) < 48 ? "walk" : "jump");
      moveToTarget(baseTarget, mode);
    };

    const startCycle = () => {
      if (isCancelled || pointsRef.current.length < 4) return;
      scheduleAutomatic(() => moveTo(1, "walk"), 1500);
      scheduleAutomatic(() => moveTo(2, "walk"), 5000);
      scheduleAutomatic(() => moveTo(3, "jump"), 8500);
      scheduleAutomatic(() => setPose("yarn"), 12000);
      scheduleAutomatic(() => setPose("idle"), 17800);
      scheduleAutomatic(() => setPose("curious"), 19500);
      scheduleAutomatic(() => setPose("idle"), 24000);
      scheduleAutomatic(() => moveTo(4), 27000);
      scheduleAutomatic(() => moveTo(5), 31500);
      scheduleAutomatic(() => moveTo(6), 36000);
      scheduleAutomatic(() => moveTo(7), 40500);
      scheduleAutomatic(() => moveTo(8), 45000);
      scheduleAutomatic(() => setPose("hide"), 48000);
      scheduleAutomatic(() => setPose("idle"), 53000);
      scheduleAutomatic(() => setPose("stretch"), 54500);
      scheduleAutomatic(() => setPose("idle"), 59000);
      scheduleAutomatic(() => setPose("sleep"), 61000);
      scheduleAutomatic(() => setPose("wake"), 69000);
      scheduleAutomatic(() => setPose("idle"), 70800);
      scheduleAutomatic(() => moveTo(0, "jump"), 72000);
      scheduleAutomatic(startCycle, 76500);
    };

    const initialize = async () => {
      await document.fonts.ready;
      if (isCancelled) return;
      readPath();
      const previousDarkMode = previousDarkModeRef.current;
      previousDarkModeRef.current = isDarkMode;
      const routePoint = pointsRef.current[currentPointRef.current] ?? pointsRef.current[0];
      if (!routePoint) return;
      setIsReady(true);

      if (isDarkMode) {
        interactionTokenRef.current += 1;
        interactionActiveRef.current = false;
        interactionTravelingRef.current = false;
        interactionLockedRef.current = false;
        setInteractionPose(null);
        setIsReacting(false);
        setIsCelebrating(false);
        setSpeechMessage("Hire me!");
        const renderedOrigin = getRenderedPosition();
        darkDockedRef.current = false;
        setIsDarkDocked(false);
        jumpToTarget(getDarkModeRestingPoint(), () => {
          const fixedNook = getDarkModeRestingPoint(true);
          currentPositionRef.current = fixedNook;
          setPosition(fixedNook);
          setJumpOrigin(fixedNook);
          darkDockedRef.current = true;
          setIsDarkDocked(true);
          setPose("sleep");
          setTravelMode("idle");
        }, renderedOrigin, true);
        return;
      }

      if (previousDarkMode) {
        const renderedOrigin = getRenderedPosition();
        darkDockedRef.current = false;
        setIsDarkDocked(false);
        currentPositionRef.current = renderedOrigin;
        setPosition(renderedOrigin);
        setJumpOrigin(renderedOrigin);
        setPose("wake");
        setTravelMode("idle");
        schedule(() => jumpToTarget(routePoint, startCycle, renderedOrigin), 1250);
        return;
      }

      currentPositionRef.current = routePoint;
      setPosition(routePoint);
      setJumpOrigin(routePoint);
      setPose("idle");
      setTravelMode("idle");
      startCycle();
    };
    const onResize = () => {
      readPath();
      const target = darkDockedRef.current
        ? getDarkModeRestingPoint(true)
        : pointsRef.current[currentPointRef.current];
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
      travelToRef.current = () => undefined;
    };
  }, [isDarkMode, prefersReducedMotion]);

  const renderedPose = interactionPose ?? pose;

  useEffect(() => {
    setFrameTick(0);
    if (prefersReducedMotion) return;
    const timer = window.setInterval(
      () => setFrameTick((frame) => frame + 1),
      getCatFrameDuration(renderedPose),
    );
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, renderedPose]);

  const playCompanionReaction = (message: string, duration: number) => {
    setIsMenuOpen(false);
    if (interactionTimerRef.current) window.clearTimeout(interactionTimerRef.current);
    interactionTokenRef.current += 1;
    interactionActiveRef.current = true;
    interactionLockedRef.current = true;
    setInteractionPose("celebrate");
    showReaction(message, duration, true);
    interactionTimerRef.current = window.setTimeout(() => {
      interactionActiveRef.current = false;
      interactionLockedRef.current = false;
      setInteractionPose(null);
      interactionTimerRef.current = null;
    }, duration);
  };

  const toggleMenu = () => setIsMenuOpen((open) => {
    if (!open) menuScrollPositionRef.current = { x: window.scrollX, y: window.scrollY };
    return !open;
  });
  const handleSayHello = () => requestAnimationFrame(() => {
    playCompanionReaction("Hello! Nice to meet you!", 3200);
    window.scrollTo(menuScrollPositionRef.current.x, menuScrollPositionRef.current.y);
  });
  const handlePet = () => playCompanionReaction("Purr... thank you!", 2600);
  const handlePlayRunner = () => {
    setIsMenuOpen(false);
    window.dispatchEvent(new Event("portfolio:open-game"));
  };

  const handleHideCat = () => {
    setIsMenuOpen(false);
    setIsHidden(true);
    try {
      localStorage.setItem("portfolio-cat-hidden", "true");
    } catch {
      // The in-memory preference still applies when storage is unavailable.
    }
  };

  const handleShowCat = () => {
    setIsHidden(false);
    try {
      localStorage.removeItem("portfolio-cat-hidden");
    } catch {
      // The in-memory preference still applies when storage is unavailable.
    }
  };

  const isArcJump = travelMode === "jumping" && !prefersReducedMotion;
  const jumpDistance = Math.hypot(position.x - jumpOrigin.x, position.y - jumpOrigin.y);
  const jumpHeight = Math.min(104, Math.max(54, 54 + jumpDistance * 0.08));
  const jumpPeak = Math.min(jumpOrigin.y, position.y) - jumpHeight;
  const animatedPosition = isArcJump
    ? {
        x: [jumpOrigin.x, (jumpOrigin.x + position.x) / 2, position.x],
        y: [jumpOrigin.y, jumpPeak, position.y],
        rotate: [0, -7 * position.facing, 0],
      }
    : { x: position.x, y: position.y, rotate: 0 };
  const movementTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : isArcJump
      ? {
          x: { duration: actionDuration, times: [0, 0.42, 1], ease: ["easeOut", "easeInOut"] },
          y: { duration: actionDuration, times: [0, 0.42, 1], ease: ["easeOut", "easeIn"] },
          rotate: { duration: actionDuration, times: [0, 0.42, 1], ease: "easeInOut" },
        }
      : travelMode === "walking"
        ? { duration: actionDuration, ease: [0.4, 0, 0.2, 1] }
        : { duration: 0.12, ease: "easeOut" };

  if (isHidden) {
    return (
      <button className="pixel-cat-show" type="button" onClick={handleShowCat}>
        <span aria-hidden="true">🐾</span> Show cat
      </button>
    );
  }

  return (
    <>
      <span className={`pixel-cat-spotlight ${isDarkMode ? "pixel-cat-spotlight--visible" : ""}`} aria-hidden="true" />
      <motion.div
        ref={companionRef}
        role="button"
        tabIndex={isReady ? 0 : -1}
        aria-label="Open the cat companion menu"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
        className={`pixel-cat-companion ${isReady ? "pixel-cat-companion--ready" : ""} ${isDarkDocked ? "pixel-cat-companion--dark" : ""} ${isCelebrating ? "pixel-cat-companion--celebrating" : ""} ${isReacting ? "pixel-cat-companion--reacting" : ""} ${isMenuOpen ? "pixel-cat-companion--menu-open" : ""} pixel-cat-companion--${travelMode} pixel-cat-companion--pose-${renderedPose} pixel-cat-companion--facing-${position.facing === 1 ? "right" : "left"}`}
        onClick={toggleMenu}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsMenuOpen(false);
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleMenu();
          }
        }}
        initial={false}
        animate={animatedPosition}
        transition={movementTransition}
      >
        <span className="pixel-cat-heart">♥</span>
        <span className="pixel-cat-zzz">Zzz</span>
        <span className="pixel-cat-speech">{speechMessage}</span>
        <span className="pixel-cat-facing"><CatSprite pose={renderedPose} tick={frameTick} /></span>
        <CatCompanionMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onSayHello={handleSayHello}
          onPlayRunner={handlePlayRunner}
          onPet={handlePet}
          onHide={handleHideCat}
        />
      </motion.div>
    </>
  );
}
