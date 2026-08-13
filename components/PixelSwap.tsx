import type { ThemeOrigin } from "@/lib/theme";

const MAX_PIXELS = 220;
const DEFAULT_PIXEL_SIZE = 70;
const PIXEL_GROW_DURATION = 360;
const FRAME_INTERVAL = 1000 / 30;

export const PIXEL_SWAP_DURATION = 1080;
export const PIXEL_MASK_PROPERTY = "--theme-pixel-mask";

type Pixel = {
  centerX: number;
  centerY: number;
  delay: number;
  size: number;
};

type PixelSwap = {
  initialMask: string;
  play: (root: HTMLElement, signal?: AbortSignal) => Promise<void>;
};

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

const createRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

function buildPixels(width: number, height: number, origin?: ThemeOrigin): Pixel[] {
  let size = DEFAULT_PIXEL_SIZE;
  let columns = Math.max(1, Math.ceil(width / size));
  let rows = Math.max(1, Math.ceil(height / size));

  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil(width / size));
    rows = Math.max(1, Math.ceil(height / size));
  }

  const seed = Math.round((origin?.x ?? width / 2) * 31 + (origin?.y ?? height / 2) * 17 + width + height);
  const random = createRandom(seed);
  const cells = Array.from({ length: columns * rows }, (_, index) => index);

  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cells[index], cells[swapIndex]] = [cells[swapIndex], cells[index]];
  }

  const spread = PIXEL_SWAP_DURATION - PIXEL_GROW_DURATION;
  const rankByCell = new Map(cells.map((cell, rank) => [cell, rank]));

  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cellLeft = column * size;
    const cellTop = row * size;
    const cellWidth = Math.min(size, width - cellLeft);
    const cellHeight = Math.min(size, height - cellTop);
    const rank = rankByCell.get(index) ?? index;
    const progress = cells.length > 1 ? rank / (cells.length - 1) : 0;

    return {
      centerX: cellLeft + cellWidth / 2,
      centerY: cellTop + cellHeight / 2,
      delay: progress * spread,
      size: Math.max(cellWidth, cellHeight) + 3,
    };
  });
}

function createMask(width: number, height: number, pixels: Pixel[], elapsed: number) {
  const holes = pixels.map((pixel) => {
    const localProgress = clamp((elapsed - pixel.delay) / PIXEL_GROW_DURATION);
    if (localProgress <= 0) return "";
    const eased = 1 - Math.pow(1 - localProgress, 3);
    const size = Math.max(1, pixel.size * eased);
    const x = pixel.centerX - size / 2;
    const y = pixel.centerY - size / 2;
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" fill="black"/>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><mask id="pixel-holes" maskUnits="userSpaceOnUse"><rect width="${width}" height="${height}" fill="white"/>${holes}</mask></defs><rect width="${width}" height="${height}" fill="white" mask="url(#pixel-holes)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function createPixelSwap(width: number, height: number, origin?: ThemeOrigin): PixelSwap {
  const pixels = buildPixels(width, height, origin);
  const initialMask = createMask(width, height, pixels, 0);

  return {
    initialMask,
    play: (root, signal) => new Promise<void>((resolve) => {
      const startedAt = performance.now();
      let lastPaintAt = -FRAME_INTERVAL;

      const paint = (timestamp: number) => {
        if (signal?.aborted) {
          resolve();
          return;
        }

        const elapsed = Math.min(timestamp - startedAt, PIXEL_SWAP_DURATION);
        if (elapsed - lastPaintAt >= FRAME_INTERVAL || elapsed === PIXEL_SWAP_DURATION) {
          root.style.setProperty(PIXEL_MASK_PROPERTY, createMask(width, height, pixels, elapsed));
          lastPaintAt = elapsed;
        }

        if (elapsed < PIXEL_SWAP_DURATION) {
          window.requestAnimationFrame(paint);
        } else {
          resolve();
        }
      };

      window.requestAnimationFrame(paint);
    }),
  };
}
