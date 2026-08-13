"use client";

import {
  createElement,
  ElementType,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";

export type TextTypeProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  text: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string | ReactNode;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
};

export function TextType({
  text,
  as: Component = "div",
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = "",
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = "|",
  cursorClassName = "",
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}: TextTypeProps) {
  const textArray = useMemo(() => {
    const values = Array.isArray(text) ? text : [text];
    return values.length ? values : [""];
  }, [text]);
  const [displayedText, setDisplayedText] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const [reducedMotion, setReducedMotion] = useState(false);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const hasStartedRef = useRef(false);

  const getTypingSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    return Math.random() * (variableSpeed.max - variableSpeed.min) + variableSpeed.min;
  }, [typingSpeed, variableSpeed]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!reducedMotion) return;
    setCurrentTextIndex(0);
    setCurrentCharIndex(textArray[0].length);
    setDisplayedText(textArray[0]);
    setIsDeleting(false);
  }, [reducedMotion, textArray]);

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setIsVisible(true);
    }, { threshold: 0.1 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!showCursor || !cursorRef.current || reducedMotion) return;
    gsap.set(cursorRef.current, { opacity: 1 });
    const tween = gsap.to(cursorRef.current, {
      opacity: 0,
      duration: cursorBlinkDuration,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut",
    });
    return () => { tween.kill(); };
  }, [cursorBlinkDuration, reducedMotion, showCursor]);

  useEffect(() => {
    if (!isVisible || reducedMotion) return;
    let timeout = 0;
    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode ? [...currentText].reverse().join("") : currentText;

    if (isDeleting) {
      if (!displayedText) {
        setIsDeleting(false);
        onSentenceComplete?.(currentText, currentTextIndex);
        if (currentTextIndex === textArray.length - 1 && !loop) return;
        setCurrentTextIndex((index) => (index + 1) % textArray.length);
        setCurrentCharIndex(0);
      } else {
        timeout = window.setTimeout(() => setDisplayedText((value) => value.slice(0, -1)), deletingSpeed);
      }
    } else if (currentCharIndex < processedText.length) {
      const delay = !hasStartedRef.current && currentCharIndex === 0 && !displayedText ? initialDelay : getTypingSpeed();
      timeout = window.setTimeout(() => {
        hasStartedRef.current = true;
        setDisplayedText((value) => value + processedText[currentCharIndex]);
        setCurrentCharIndex((index) => index + 1);
      }, delay);
    } else if (loop || currentTextIndex < textArray.length - 1) {
      timeout = window.setTimeout(() => setIsDeleting(true), pauseDuration);
    }

    return () => window.clearTimeout(timeout);
  }, [
    currentCharIndex,
    currentTextIndex,
    deletingSpeed,
    displayedText,
    getTypingSpeed,
    initialDelay,
    isDeleting,
    isVisible,
    loop,
    onSentenceComplete,
    pauseDuration,
    reducedMotion,
    reverseMode,
    textArray,
  ]);

  const currentText = textArray[currentTextIndex];
  const cursorHidden = hideCursorWhileTyping && (currentCharIndex < currentText.length || isDeleting);
  const color = textColors.length ? textColors[currentTextIndex % textColors.length] : "inherit";

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `text-type ${className}`.trim(),
      ...props,
    },
    <span className="text-type__content" style={{ color }}>{displayedText}</span>,
    showCursor && (
      <span ref={cursorRef} className={`text-type__cursor ${cursorHidden ? "text-type__cursor--hidden" : ""} ${cursorClassName}`.trim()}>
        {cursorCharacter}
      </span>
    ),
  );
}
