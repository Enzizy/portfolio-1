import { CanvasTexture, SRGBColorSpace } from "three";

export type Fonts = { display: string; mono: string };

type LabelOptions = {
  width?: number;
  height?: number;
  background: string;
  color: string;
  family: string;
  weight?: number;
  /** Optional small line above the main text, e.g. "ISLAND 01". */
  kicker?: string;
  kickerFamily?: string;
  /** Painted plank seams, for wooden signs. */
  planks?: number;
  border?: string;
};

/**
 * Hand-lettered signs, drawn once on a canvas: wooden boards, crate stencils, stall
 * banners. The text shrinks to fit rather than overflowing the board.
 */
export function labelTexture(text: string, options: LabelOptions) {
  const width = options.width ?? 512;
  const height = options.height ?? 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, width, height);

    if (options.planks) {
      context.strokeStyle = "rgba(40, 24, 10, .22)";
      context.lineWidth = Math.max(2, height * 0.012);
      for (let i = 1; i < options.planks; i++) {
        const y = (height / options.planks) * i;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
    }
    if (options.border) {
      context.strokeStyle = options.border;
      context.lineWidth = height * 0.04;
      context.strokeRect(context.lineWidth / 2, context.lineWidth / 2, width - context.lineWidth, height - context.lineWidth);
    }

    context.fillStyle = options.color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const hasKicker = Boolean(options.kicker);
    if (options.kicker) {
      context.globalAlpha = 0.72;
      context.font = `500 ${Math.round(height * 0.13)}px ${options.kickerFamily ?? options.family}`;
      context.fillText(options.kicker, width / 2, height * 0.27);
      context.globalAlpha = 1;
    }

    let size = height * (hasKicker ? 0.36 : 0.44);
    const weight = options.weight ?? 700;
    context.font = `${weight} ${Math.round(size)}px ${options.family}`;
    const maxWidth = width * 0.86;
    const measured = context.measureText(text).width;
    if (measured > maxWidth) {
      size *= maxWidth / measured;
      context.font = `${weight} ${Math.round(size)}px ${options.family}`;
    }
    context.fillText(text, width / 2, hasKicker ? height * 0.6 : height / 2);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
