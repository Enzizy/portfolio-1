export type CatPosition = { x: number; y: number; facing: 1 | -1 };
export type TravelMode = "idle" | "walking" | "jumping";
export type TravelTo = (target: CatPosition, mode?: "walk" | "jump", onSettled?: () => void) => void;

export const PERCH_OFFSETS = [0.14, 0.82, 0.25, 0.72, 0.38];
export const WALK_DURATION_SECONDS = 2.4;
export const JUMP_DURATION_SECONDS = 1.8;
export const DARK_RESTING_RIGHT_OFFSET = 108;
export const MOBILE_DARK_RESTING_RIGHT_OFFSET = 101;
