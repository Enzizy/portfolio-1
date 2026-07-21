export type CatPose =
  | "idle"
  | "walk"
  | "run"
  | "crouch"
  | "launch"
  | "airborne"
  | "fall"
  | "land"
  | "curious"
  | "stretch"
  | "sleep"
  | "wake"
  | "yarn"
  | "inspect"
  | "celebrate"
  | "hide";

type SpriteSequence = {
  row: number;
  frames: number[];
  duration: number;
};

const SPRITE_SEQUENCES: Record<CatPose, SpriteSequence> = {
  walk: { row: 0, frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 170 },
  run: { row: 1, frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 105 },
  crouch: { row: 2, frames: [0], duration: 360 },
  launch: { row: 2, frames: [1, 2], duration: 180 },
  airborne: { row: 2, frames: [2, 3, 4], duration: 220 },
  fall: { row: 2, frames: [5], duration: 260 },
  land: { row: 2, frames: [6, 7], duration: 220 },
  idle: { row: 3, frames: [0, 1, 2, 1], duration: 440 },
  curious: { row: 3, frames: [1, 2, 3, 4, 3, 2], duration: 380 },
  stretch: { row: 3, frames: [4, 5, 6, 7, 6, 5], duration: 430 },
  sleep: { row: 4, frames: [0, 1, 2, 3, 2, 1], duration: 820 },
  wake: { row: 4, frames: [3, 4, 5, 6, 7], duration: 360 },
  yarn: { row: 5, frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 260 },
  inspect: { row: 6, frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 330 },
  celebrate: { row: 7, frames: [0, 1, 2, 1, 0, 2, 3], duration: 250 },
  hide: { row: 7, frames: [4, 5, 6, 7, 6, 5], duration: 430 },
};

export function getCatFrameDuration(pose: CatPose) {
  return SPRITE_SEQUENCES[pose].duration;
}

export function CatSprite({ pose, tick }: { pose: CatPose; tick: number }) {
  const sequence = SPRITE_SEQUENCES[pose];
  const column = sequence.frames[tick % sequence.frames.length];

  return (
    <span
      className="pixel-cat-sprite"
      role="img"
      aria-label={`A cute black pixel cat performing ${pose}`}
      style={{ backgroundPosition: `${(column / 7) * 100}% ${(sequence.row / 7) * 100}%` }}
    />
  );
}
