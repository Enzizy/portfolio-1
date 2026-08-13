"use client";

import { CSSProperties, useMemo } from "react";
import { ThemeName, ThemeOrigin } from "@/lib/theme";

const MAX_PIXELS = 220;
export const PIXEL_SWAP_DURATION = 1120;
const PIXEL_DURATION = 260;
const DEFAULT_PIXEL_SIZE = 66;

type Pixel = {
  id: number;
  left: number;
  top: number;
  offset: number;
};

type PixelSwapProps = {
  previousTheme: ThemeName;
  running: boolean;
  origin?: ThemeOrigin;
  viewportWidth: number;
  viewportHeight: number;
};

const noise = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

function buildPixels(width: number, height: number, origin?: ThemeOrigin): { pixels: Pixel[]; size: number } {
  let size = DEFAULT_PIXEL_SIZE;
  let columns = Math.max(1, Math.ceil(width / size));
  let rows = Math.max(1, Math.ceil(height / size));

  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil(width / size));
    rows = Math.max(1, Math.ceil(height / size));
  }

  const originX = origin?.x ?? width / 2;
  const originY = origin?.y ?? height / 2;
  const maxDistance = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(width - originX, originY),
    Math.hypot(originX, height - originY),
    Math.hypot(width - originX, height - originY),
    1,
  );
  const gridWidth = columns * size;
  const gridHeight = rows * size;
  const gridLeft = (width - gridWidth) / 2;
  const gridTop = (height - gridHeight) / 2;
  const pixels: Pixel[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const id = row * columns + column;
      const left = gridLeft + column * size;
      const top = gridTop + row * size;
      const distance = Math.hypot(left + size / 2 - originX, top + size / 2 - originY) / maxDistance;
      // A little deterministic noise keeps the wave organic without making
      // every tile begin together like the previous grid animation.
      const offset = Math.min(1, Math.max(0, distance * 0.94 + noise(id + 1) * 0.06));
      pixels.push({ id, left, top, offset });
    }
  }

  return { pixels, size };
}

export function PixelSwap({ previousTheme, running, origin, viewportWidth, viewportHeight }: PixelSwapProps) {
  const { pixels, size } = useMemo(
    () => buildPixels(viewportWidth, viewportHeight, origin),
    [origin, viewportHeight, viewportWidth],
  );
  const spread = PIXEL_SWAP_DURATION - PIXEL_DURATION;

  return (
    <div className={`theme-pixel-transition theme-pixel-transition--${previousTheme}${running ? " is-running" : ""}`} aria-hidden="true">
      {pixels.map((pixel) => (
        <span
          key={pixel.id}
          className="theme-pixel-transition__tile"
          style={{
            left: pixel.left,
            top: pixel.top,
            width: size,
            height: size,
            "--tile-delay": `${Math.round(pixel.offset * spread)}ms`,
            "--tile-duration": `${PIXEL_DURATION}ms`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
