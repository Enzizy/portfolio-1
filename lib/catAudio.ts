"use client";

export type CatSoundEffect = "jump" | "collect" | "crash" | "purr" | "hello" | "sleep";

const SOUND_PREFERENCE_KEY = "portfolio-cat-sound";
const NOTE_LENGTH = 60 / 136 / 2;
const RUNNER_MELODY = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 880, 698.46,
  659.25, 783.99, 987.77, 783.99,
  587.33, 698.46, 783.99, 523.25,
];

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioContext;
}

export function isCatSoundEnabled() {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SOUND_PREFERENCE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setCatSoundEnabled(enabled: boolean) {
  try {
    if (enabled) localStorage.removeItem(SOUND_PREFERENCE_KEY);
    else localStorage.setItem(SOUND_PREFERENCE_KEY, "off");
  } catch {
    // The in-memory control still works when storage is unavailable.
  }
}

export async function unlockCatAudio() {
  if (!isCatSoundEnabled()) return;
  const context = getAudioContext();
  if (context?.state === "suspended") {
    try {
      await context.resume();
    } catch {
      // The browser may require a more direct user gesture before audio can start.
    }
  }
}

function scheduleTone(
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = "square",
  endFrequency = frequency,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.018, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playCatSound(effect: CatSoundEffect) {
  if (!isCatSoundEnabled()) return;
  const context = getAudioContext();
  if (!context) return;
  void context.resume().catch(() => undefined);
  const output = context.createGain();
  output.gain.value = 0.7;
  output.connect(context.destination);
  const now = context.currentTime + 0.01;

  if (effect === "jump") {
    scheduleTone(context, output, 330, now, 0.11, 0.08, "square", 660);
    scheduleTone(context, output, 520, now + 0.07, 0.1, 0.045, "triangle", 820);
  } else if (effect === "collect") {
    scheduleTone(context, output, 880, now, 0.08, 0.055, "square");
    scheduleTone(context, output, 1174.66, now + 0.065, 0.13, 0.05, "square");
  } else if (effect === "crash") {
    scheduleTone(context, output, 190, now, 0.34, 0.08, "sawtooth", 48);
    scheduleTone(context, output, 110, now + 0.03, 0.3, 0.045, "square", 38);
  } else if (effect === "purr") {
    [0, 0.11, 0.22, 0.33].forEach((offset, index) => {
      scheduleTone(context, output, 64 + index * 3, now + offset, 0.17, 0.025, "triangle", 58);
    });
  } else if (effect === "hello") {
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      scheduleTone(context, output, frequency, now + index * 0.085, 0.18, 0.035, "triangle");
    });
  } else {
    scheduleTone(context, output, 196, now, 0.32, 0.022, "sine", 174.61);
    scheduleTone(context, output, 146.83, now + 0.28, 0.38, 0.018, "sine", 130.81);
  }

  window.setTimeout(() => output.disconnect(), 900);
}

export function startRunnerMusic() {
  if (!isCatSoundEnabled()) return () => undefined;
  const context = getAudioContext();
  if (!context) return () => undefined;
  void context.resume().catch(() => undefined);
  const output = context.createGain();
  output.gain.value = 0.12;
  output.connect(context.destination);
  let noteIndex = 0;
  let nextNoteTime = context.currentTime + 0.04;
  let stopped = false;

  const schedule = () => {
    while (!stopped && nextNoteTime < context.currentTime + 0.3) {
      const frequency = RUNNER_MELODY[noteIndex % RUNNER_MELODY.length];
      scheduleTone(context, output, frequency, nextNoteTime, NOTE_LENGTH * 0.78, 0.12, "square");
      if (noteIndex % 4 === 0) {
        scheduleTone(context, output, frequency / 4, nextNoteTime, NOTE_LENGTH * 1.8, 0.08, "triangle");
      }
      noteIndex += 1;
      nextNoteTime += NOTE_LENGTH;
    }
  };

  schedule();
  const scheduler = window.setInterval(schedule, 90);
  return () => {
    stopped = true;
    window.clearInterval(scheduler);
    output.gain.cancelScheduledValues(context.currentTime);
    output.gain.setValueAtTime(Math.max(0.0001, output.gain.value), context.currentTime);
    output.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08);
    window.setTimeout(() => output.disconnect(), 120);
  };
}
