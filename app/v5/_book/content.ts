// The pages of the book, drawn on canvases. Each page records its clickable link
// regions and, for projects, the screenshot rectangle that comes alive on hover —
// both in normalised page coordinates (0..1 from the top-left), so the 3D scene can
// map a raycast UV straight onto them.

import { projects, services, stackGroups } from "@/data/portfolio";

export type PageRect = { x: number; y: number; w: number; h: number };
export type PageLink = PageRect & { href: string; label: string };
export type PageMotion = PageRect & { src: string };
export type BookPage = {
  label: string;
  canvas: HTMLCanvasElement;
  links: PageLink[];
  motion?: PageMotion;
  /** Redraws the page at a reveal of 0..1, with an optional hovered link inked up. */
  render: (reveal: number, hoverHref?: string | null) => void;
};
export type BookFonts = { serif: string; sans: string; mono: string };
export type Day = { week: number; weekday: number; level: number };
export type BookData = { days: Day[]; weekCount: number; contributionCount: number | null };

/** Page proportions; the 3D leaf uses the same ratio (1 : 1.4). */
export const PAGE_RATIO = 1.4;
/** Every layout below is written at this width and scaled to the real canvas. */
const DESIGN_WIDTH = 768;

const INK = "#1c1a17";
const BODY = "#2b2723";
const MUTED = "#6c6358";
const ACCENT = "#a2541f";
const PAPER = "#f3efe7";

export const projectShots: Record<(typeof projects)[number]["visual"], string> = {
  dashboard: "/images/projects/hr.png",
  localaid: "/images/projects/localaid.png",
  streetkings: "/images/projects/street.png",
  furniture: "/images/projects/bw.png",
  bookvoice: "/images/projects/book.png",
  casatoon: "/images/projects/casatoon.webp",
  "joyno-accounting": "/images/projects/joyno-accounting.png",
  ccr: "/images/projects/ccr.png",
  "lifedesk-crm": "/images/projects/lifedesk-crm.png",
  lifedesk: "/images/projects/lifedesk-home.png",
};

/** Served through next/image, so the book never pulls the multi-megabyte originals. */
export function optimised(src: string, width = 828) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

export function imageSources() {
  return ["/images/me.jpg", ...projects.map((project) => projectShots[project.visual])];
}

export async function loadImages(sources: string[], onProgress?: (done: number, total: number) => void) {
  const images = new Map<string, HTMLImageElement>();
  let done = 0;
  await Promise.all(
    sources.map(
      (src) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          image.decoding = "async";
          image.onload = () => {
            images.set(src, image);
            onProgress?.(++done, sources.length);
            resolve();
          };
          image.onerror = () => {
            onProgress?.(++done, sources.length);
            resolve();
          };
          image.src = optimised(src, src.includes("me.jpg") ? 640 : 828);
        }),
    ),
  );
  return images;
}

type TextStyle = {
  family: string;
  size: number;
  weight?: number;
  color?: string;
  italic?: boolean;
  lineHeight?: number;
  maxWidth?: number;
  align?: CanvasTextAlign;
  spacing?: number;
  upper?: boolean;
};

/**
 * How a piece of content arrives as its page is revealed. `at` and `dur` are in
 * reveal units (0..1 across the whole page), so the same choreography plays
 * whether it is driven by a page being dragged or by the clock.
 */
type Anim = {
  at: number;
  dur?: number;
  /** rise: the block lifts in · words / chars: one unit after another · type: typewriter. */
  mode?: "rise" | "fade" | "words" | "chars" | "type";
  stagger?: number;
};

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);

/** Paper, grain and the gutter shadow: drawn once per side, reused on every redraw. */
const paperLayers = new Map<string, HTMLCanvasElement>();
function paperLayer(side: "left" | "right", pixelWidth: number) {
  const key = `${side}:${pixelWidth}`;
  let layer = paperLayers.get(key);
  if (layer) return layer;
  layer = document.createElement("canvas");
  layer.width = pixelWidth;
  layer.height = Math.round(pixelWidth * PAGE_RATIO);
  const ctx = layer.getContext("2d")!;
  const scale = pixelWidth / DESIGN_WIDTH;
  ctx.scale(scale, scale);
  const width = DESIGN_WIDTH;
  const height = DESIGN_WIDTH * PAGE_RATIO;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  let seed = side === "right" ? 7 : 13;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = "rgba(60, 45, 30, 0.035)";
  for (let i = 0; i < 2600; i++) ctx.fillRect(random() * width, random() * height, 1.2, 1.2);
  // A few longer paper fibres.
  ctx.strokeStyle = "rgba(60, 45, 30, 0.05)";
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 70; i++) {
    const x = random() * width;
    const y = random() * height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (random() - 0.5) * 18, y + (random() - 0.5) * 18, x + (random() - 0.5) * 30, y + (random() - 0.5) * 30);
    ctx.stroke();
  }
  const gutter = side === "right" ? ctx.createLinearGradient(0, 0, 70, 0) : ctx.createLinearGradient(width, 0, width - 70, 0);
  gutter.addColorStop(0, "rgba(40, 28, 16, 0.22)");
  gutter.addColorStop(1, "rgba(40, 28, 16, 0)");
  ctx.fillStyle = gutter;
  ctx.fillRect(0, 0, width, height);
  paperLayers.set(key, layer);
  return layer;
}

/** One page: a canvas plus helpers that work in 768-wide design units. */
class Page {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly links: PageLink[] = [];
  motion?: PageMotion;
  readonly scale: number;
  readonly width = DESIGN_WIDTH;
  readonly height = DESIGN_WIDTH * PAGE_RATIO;
  /** Content box: the gutter margin is wider than the outer one. */
  readonly left: number;
  readonly right: number;
  /** How far the page has been revealed, 0..1. */
  t = 1;
  hoverHref: string | null = null;
  draw: (page: Page) => void = () => undefined;

  constructor(readonly pixelWidth: number, readonly side: "left" | "right") {
    this.canvas = document.createElement("canvas");
    this.canvas.width = pixelWidth;
    this.canvas.height = Math.round(pixelWidth * PAGE_RATIO);
    this.ctx = this.canvas.getContext("2d")!;
    this.scale = pixelWidth / DESIGN_WIDTH;
    this.left = side === "right" ? 88 : 64;
    this.right = this.width - (side === "right" ? 64 : 88);
  }

  get contentWidth() {
    return this.right - this.left;
  }

  render(reveal: number, hoverHref: string | null = null) {
    this.t = clamp01(reveal);
    this.hoverHref = hoverHref;
    this.links.length = 0;
    const { ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(paperLayer(this.side, this.pixelWidth), 0, 0);
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.draw(this);
  }

  /** Eased progress of something that starts at `start` and takes `dur` (reveal units). */
  at(start: number, dur = 0.22) {
    if (this.t >= 1) return 1;
    return easeOut(clamp01((this.t - start) / dur));
  }

  private setFont(style: TextStyle) {
    const { ctx } = this;
    ctx.font = `${style.italic ? "italic " : ""}${style.weight ?? 400} ${style.size}px ${style.family}`;
    ctx.fillStyle = style.color ?? INK;
    ctx.textBaseline = "alphabetic";
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${style.spacing ?? 0}px`;
  }

  private wrap(content: string, maxWidth: number) {
    const lines: string[] = [];
    for (const paragraph of content.split("\n")) {
      let line = "";
      for (const word of paragraph.split(" ")) {
        const attempt = line ? `${line} ${word}` : word;
        if (this.ctx.measureText(attempt).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = attempt;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  /** Lays out (wrapped) text and draws as much of it as the reveal allows. Returns the last baseline. */
  text(value: string, x: number, y: number, style: TextStyle, anim?: Anim) {
    const { ctx } = this;
    this.setFont(style);
    const lineHeight = (style.lineHeight ?? 1.3) * style.size;
    const content = style.upper ? value.toUpperCase() : value;
    const lines = this.wrap(content, style.maxWidth ?? Infinity);
    const align = style.align ?? "left";
    const lastBaseline = y + (lines.length - 1) * lineHeight;
    const startX = (line: string) => {
      if (align === "left" || align === "start") return x;
      const width = ctx.measureText(line).width;
      return align === "center" ? x - width / 2 : x - width;
    };
    const mode = anim?.mode ?? "rise";
    const dur = anim?.dur ?? 0.22;

    if (!anim || this.t >= 1 || mode === "rise" || mode === "fade") {
      const a = anim ? this.at(anim.at, dur) : 1;
      if (a > 0) {
        ctx.save();
        ctx.globalAlpha *= a;
        if (anim && mode === "rise") ctx.translate(0, (1 - a) * Math.max(10, style.size * 0.35));
        ctx.textAlign = "left";
        lines.forEach((line, index) => ctx.fillText(line, startX(line), y + index * lineHeight));
        ctx.restore();
      }
    } else if (mode === "type") {
      const total = lines.reduce((sum, line) => sum + line.length, 0);
      let budget = Math.floor(total * this.at(anim.at, dur));
      let caret: { x: number; y: number } | null = null;
      ctx.textAlign = "left";
      lines.forEach((line, index) => {
        if (budget <= 0) return;
        const shown = line.slice(0, budget);
        budget -= line.length;
        const sx = startX(line);
        ctx.fillText(shown, sx, y + index * lineHeight);
        caret = { x: sx + ctx.measureText(shown).width + 2, y: y + index * lineHeight };
      });
      const a = this.at(anim.at, dur);
      if (caret && a > 0 && a < 1) {
        const { x: cx, y: cy } = caret as { x: number; y: number };
        ctx.fillStyle = ACCENT;
        ctx.fillRect(cx, cy - style.size * 0.8, Math.max(1.5, style.size * 0.08), style.size * 0.95);
      }
    } else {
      // words / chars: each unit lifts in on its own, staggered.
      const stagger = anim.stagger ?? (mode === "chars" ? 0.025 : 0.035);
      let unit = 0;
      ctx.textAlign = "left";
      lines.forEach((line, index) => {
        const units = mode === "chars" ? [...line] : line.split(/(?<= )/);
        const sx = startX(line);
        let prefix = "";
        for (const piece of units) {
          const a = this.at(anim.at + unit * stagger, dur);
          unit++;
          const px = sx + ctx.measureText(prefix).width;
          prefix += piece;
          if (a <= 0) continue;
          ctx.save();
          ctx.globalAlpha *= a;
          ctx.translate(0, (1 - a) * style.size * (mode === "chars" ? 0.45 : 0.3));
          ctx.fillText(piece, px, y + index * lineHeight);
          ctx.restore();
        }
      });
    }
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
    return lastBaseline;
  }

  measure(value: string, style: TextStyle) {
    this.setFont(style);
    const width = this.ctx.measureText(style.upper ? value.toUpperCase() : value).width;
    if ("letterSpacing" in this.ctx) (this.ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
    return width;
  }

  /** A hairline that draws itself across the page. */
  rule(y: number, start = 0, color = "rgba(28, 26, 23, 0.16)") {
    const a = this.at(start, 0.3);
    if (a <= 0) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.left, y, this.contentWidth * a, 1);
  }

  /** Records a clickable region (design units) on the page. */
  link(x: number, y: number, w: number, h: number, href: string, label: string) {
    this.links.push({ x: x / this.width, y: y / this.height, w: w / this.width, h: h / this.height, href, label });
  }

  /** An underlined text link: it rises in, its underline draws, and it inks up on hover. */
  textLink(label: string, x: number, y: number, href: string, fonts: BookFonts, size = 18, start = 0.6) {
    const { ctx } = this;
    const style: TextStyle = { family: fonts.sans, size, weight: 600, color: ACCENT };
    const width = this.measure(label, style);
    this.link(x - 6, y - size - 4, width + 12, size + 16, href, label);
    const a = this.at(start, 0.22);
    if (a <= 0) return width;
    const hovered = this.hoverHref === href;
    if (hovered) {
      ctx.fillStyle = "rgba(162, 84, 31, 0.13)";
      ctx.beginPath();
      ctx.roundRect(x - 8, y - size - 2, width + 16, size + 14, 4);
      ctx.fill();
    }
    this.text(label, x, y, hovered ? { ...style, color: "#7a3c12" } : style, { at: start, dur: 0.22 });
    const line = this.at(start + 0.1, 0.25);
    ctx.fillStyle = hovered ? "#7a3c12" : ACCENT;
    ctx.fillRect(x, y + 5, width * line, hovered ? 2.5 : 1.5);
    return width;
  }

  /**
   * Cover-fits an image, cropped from the top so screenshots show their header. It
   * develops from the top down behind a moving scan line; `print` instead fades up
   * from blank paper, like a photograph in the tray.
   */
  image(image: HTMLImageElement | undefined, x: number, y: number, w: number, h: number, radius = 6, start = 0.15, print = false) {
    const { ctx } = this;
    const reveal = this.at(start, print ? 0.5 : 0.4);
    if (reveal <= 0) return;
    const shown = print ? h : h * reveal;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, shown, radius);
    ctx.clip();
    ctx.fillStyle = "#d9d3c8";
    ctx.fillRect(x, y, w, h);
    if (image?.naturalWidth) {
      const target = w / h;
      const source = image.naturalWidth / image.naturalHeight;
      // A slow settle from a slight zoom as it develops.
      const zoom = 1 + (1 - reveal) * 0.05;
      const dw = w * zoom;
      const dh = h * zoom;
      const dx = x - (dw - w) / 2;
      const dy = y - (dh - h) / 2;
      if (source > target) {
        const sw = image.naturalHeight * target;
        ctx.drawImage(image, (image.naturalWidth - sw) / 2, 0, sw, image.naturalHeight, dx, dy, dw, dh);
      } else {
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalWidth / target, dx, dy, dw, dh);
      }
    }
    if (print && reveal < 1) {
      ctx.fillStyle = `rgba(243, 239, 231, ${(1 - reveal) * 0.95})`;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
    if (!print && reveal < 1) {
      ctx.fillStyle = "rgba(162, 84, 31, 0.85)";
      ctx.fillRect(x, y + shown - 1.5, w, 3);
      ctx.fillStyle = "rgba(255, 220, 180, 0.35)";
      ctx.fillRect(x, y + shown - 10, w, 8);
    }
    if (reveal >= 1 || print) {
      ctx.strokeStyle = `rgba(28, 26, 23, ${0.18 * reveal})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, radius);
      ctx.stroke();
    }
  }

  /** Running head and folio, like a printed book. Always there: the page is never blank. */
  furniture(section: string, folio: number, fonts: BookFonts) {
    const mono: TextStyle = { family: fonts.mono, size: 13, color: MUTED, spacing: 2, upper: true };
    const outer = this.side === "right" ? this.right : this.left;
    const inner = this.side === "right" ? this.left : this.right;
    this.text("Zhyronne Batican", inner, 58, { ...mono, align: this.side === "right" ? "left" : "right" });
    this.text(section, outer, 58, { ...mono, align: this.side === "right" ? "right" : "left" });
    this.text(String(folio).padStart(2, "0"), outer, this.height - 46, { ...mono, size: 14, align: this.side === "right" ? "right" : "left" });
  }

  kicker(value: string, y: number, fonts: BookFonts, start = 0) {
    return this.text(value, this.left, y, { family: fonts.mono, size: 15, color: ACCENT, spacing: 2.4, upper: true }, { at: start, dur: 0.18, mode: "type" });
  }
}

/** Draws every page of the book (in reading order) plus the cover art. */
export function buildBook(fonts: BookFonts, images: Map<string, HTMLImageElement>, data: BookData, pixelWidth: number) {
  const pages: BookPage[] = [];
  const serif = (size: number, extra: Partial<TextStyle> = {}): TextStyle => ({ family: fonts.serif, size, color: INK, lineHeight: 1.02, ...extra });
  const body = (extra: Partial<TextStyle> = {}): TextStyle => ({ family: fonts.sans, size: 21, color: BODY, lineHeight: 1.55, ...extra });
  const monoLabel = (extra: Partial<TextStyle> = {}): TextStyle => ({ family: fonts.mono, size: 14, color: MUTED, spacing: 2, upper: true, ...extra });

  const add = (label: string, draw: (p: Page) => void) => {
    const p = new Page(pixelWidth, pages.length % 2 === 0 ? "right" : "left");
    const folio = pages.length + 1;
    p.draw = (page) => draw(Object.assign(page, { folio }));
    p.render(1);
    pages.push({ label, canvas: p.canvas, links: p.links, motion: p.motion, render: (reveal, hover) => p.render(reveal, hover ?? null) });
    return p;
  };
  type Numbered = Page & { folio?: number };
  const folioOf = (p: Page) => (p as Numbered).folio ?? 0;

  // 1 — title page: the name rises letter by letter.
  add("Title", (p) => {
    p.text("A portfolio in print", p.left, 150, { family: fonts.mono, size: 15, color: ACCENT, spacing: 2.4, upper: true }, { at: 0, dur: 0.2, mode: "type" });
    const end = p.text("Zhyronne\nBatican", p.left - 4, 300, serif(128, { lineHeight: 0.92 }), { at: 0.08, dur: 0.2, mode: "chars", stagger: 0.028 });
    p.rule(end + 90, 0.45);
    p.text("Full-stack developer · AI engineer · UI/UX designer", p.left, end + 136, body({ size: 21, color: INK, maxWidth: p.contentWidth }), { at: 0.5, mode: "words", stagger: 0.02 });
    p.text(
      "Custom web apps, WordPress sites, landing pages, mobile tools and AI-assisted workflows — built in the Philippines for teams anywhere.",
      p.left,
      end + 190,
      body({ maxWidth: p.contentWidth - 40 }),
      { at: 0.62, dur: 0.25 },
    );
    p.text("Selected work · 2024 – 2026", p.left, 880, monoLabel(), { at: 0.75, dur: 0.15, mode: "type" });
    p.text("Hold the corner and drag →", p.right, p.height - 46, { family: fonts.serif, size: 24, italic: true, color: MUTED, align: "right" }, { at: 0.85, dur: 0.15 });
  });

  // 2 — about
  add("About", (p) => {
    p.furniture("About", folioOf(p), fonts);
    p.kicker("01 — About", 150, fonts);
    const end = p.text("I turn ideas into products people actually use.", p.left, 236, serif(64, { maxWidth: p.contentWidth }), { at: 0.08, mode: "words", stagger: 0.03 });
    let y = end + 70;
    [
      "I'm a freelance full-stack developer building web apps, WordPress websites, landing pages, mobile tools, and AI-assisted experiences.",
      "From focused business pages to custom software and automation, I enjoy turning ideas into products that are simple, efficient, and useful.",
      "I keep exploring emerging technology in artificial intelligence, automation, and interactive web experiences — this book is one of those experiments.",
    ].forEach((paragraph, index) => {
      y = p.text(paragraph, p.left, y, body({ maxWidth: p.contentWidth }), { at: 0.4 + index * 0.12, dur: 0.25 }) + 46;
    });
  });

  // 3 — portrait: develops like a print in the tray.
  add("About", (p) => {
    p.furniture("About", folioOf(p), fonts);
    p.image(images.get("/images/me.jpg"), p.left, 110, p.contentWidth, 640, 4, 0.05, true);
    p.text("Fig. 1 — The author, somewhere between a deploy and a coffee.", p.left, 784, { family: fonts.serif, size: 22, italic: true, color: MUTED, maxWidth: p.contentWidth }, { at: 0.5, mode: "words", stagger: 0.015 });
    p.rule(840, 0.55);
    p.text("Based in", p.left, 884, monoLabel(), { at: 0.6, dur: 0.12, mode: "type" });
    p.text("Philippines · remote-friendly", p.left, 914, body({ color: INK }), { at: 0.65 });
    p.text("Status", p.left + 330, 884, monoLabel(), { at: 0.66, dur: 0.12, mode: "type" });
    const dot = p.at(0.72, 0.2);
    if (dot > 0) {
      p.ctx.fillStyle = "#3f8a5a";
      p.ctx.beginPath();
      p.ctx.arc(p.left + 336, 908, 5 * dot, 0, Math.PI * 2);
      p.ctx.fill();
      // The ripple of a status light switching on.
      if (dot < 1) {
        p.ctx.strokeStyle = `rgba(63, 138, 90, ${1 - dot})`;
        p.ctx.lineWidth = 2;
        p.ctx.beginPath();
        p.ctx.arc(p.left + 336, 908, 5 + dot * 18, 0, Math.PI * 2);
        p.ctx.stroke();
      }
    }
    p.text("Taking on freelance work", p.left + 350, 914, body({ color: INK }), { at: 0.72 });
    p.textLink("Download the résumé →", p.left, 990, "/resume.pdf", fonts, 19, 0.8);
  });

  // 4 — services: each line arrives on its own rule.
  add("Services", (p) => {
    p.furniture("Services", folioOf(p), fonts);
    p.kicker("02 — Services", 150, fonts);
    p.text("What we can build together.", p.left, 236, serif(58, { maxWidth: p.contentWidth }), { at: 0.06, mode: "words", stagger: 0.035 });
    let y = 372;
    services.forEach((service, index) => {
      const start = 0.28 + index * 0.08;
      p.rule(y - 34, start - 0.04);
      p.text(String(index + 1).padStart(2, "0"), p.left, y, { family: fonts.mono, size: 15, color: ACCENT, spacing: 1 }, { at: start, dur: 0.12, mode: "type" });
      p.ctx.save();
      const slide = p.at(start, 0.22);
      p.ctx.translate((1 - slide) * 24, 0);
      p.text(service.title, p.left + 56, y + 4, serif(32), { at: start, dur: 0.22, mode: "fade" });
      const end = p.text(service.description, p.left + 56, y + 40, body({ size: 18, maxWidth: p.contentWidth - 56 }), { at: start + 0.05, dur: 0.22, mode: "fade" });
      p.ctx.restore();
      y = end + 54;
    });
  });

  // 5 — toolbox: tools drop in one by one.
  add("Toolbox", (p) => {
    p.furniture("Toolbox", folioOf(p), fonts);
    p.kicker("03 — Toolbox", 150, fonts);
    p.text("Chosen per product, not per habit.", p.left, 236, serif(58, { maxWidth: p.contentWidth }), { at: 0.06, mode: "words", stagger: 0.035 });
    let y = 410;
    stackGroups.forEach((group, index) => {
      const start = 0.3 + index * 0.1;
      p.text(group.title, p.left, y, monoLabel(), { at: start, dur: 0.1, mode: "type" });
      y = p.text(group.items.join(" · "), p.left, y + 36, { family: fonts.serif, size: 27, color: INK, lineHeight: 1.25, maxWidth: p.contentWidth }, { at: start + 0.03, dur: 0.16, mode: "words", stagger: 0.012 }) + 66;
    });
  });

  // 6–14 — one project per page: the plate lands, the screenshot develops.
  projects.forEach((project, index) => {
    add(project.title, (p) => {
      p.furniture("Selected work", folioOf(p), fonts);
      p.kicker(`Project ${project.number} / ${String(projects.length).padStart(2, "0")}`, 132, fonts);
      // Screenshots sit on a dark ink plate with a soft shadow, so light-themed apps
      // keep a hard edge against cream paper instead of dissolving into it.
      const plate = { x: p.left, y: 158, w: p.contentWidth, h: Math.round(p.contentWidth * 0.68) + 28 };
      const land = p.at(0.04, 0.25);
      if (land > 0) {
        p.ctx.save();
        p.ctx.globalAlpha = land;
        p.ctx.shadowColor = "rgba(40, 28, 16, 0.32)";
        p.ctx.shadowBlur = 22 + (1 - land) * 30;
        p.ctx.shadowOffsetY = 8 + (1 - land) * 22;
        p.ctx.fillStyle = "#1f1c19";
        p.ctx.beginPath();
        p.ctx.roundRect(plate.x, plate.y - (1 - land) * 18, plate.w, plate.h, 8);
        p.ctx.fill();
        p.ctx.restore();
      }
      const shot = { x: plate.x + 14, y: plate.y + 14, w: plate.w - 28, h: plate.h - 28 };
      const src = projectShots[project.visual];
      if (land >= 1) p.image(images.get(src), shot.x, shot.y, shot.w, shot.h, 4, 0.18);
      else if (land > 0.6) p.image(images.get(src), shot.x, shot.y - (1 - land) * 18, shot.w, shot.h, 4, 0.18);
      p.motion = { src, x: shot.x / p.width, y: shot.y / p.height, w: shot.w / p.width, h: shot.h / p.height };
      let y = plate.y + plate.h + 84;
      y = p.text(project.title, p.left, y, serif(62, { maxWidth: p.contentWidth }), { at: 0.38, dur: 0.2, mode: "chars", stagger: 0.012 }) + 42;
      p.text(project.technologies.join(" · "), p.left, y, { family: fonts.mono, size: 15, color: ACCENT, spacing: 1.5, upper: true }, { at: 0.5, dur: 0.15, mode: "type" });
      y = p.text(project.description, p.left, y + 44, body({ size: 21, maxWidth: p.contentWidth }), { at: 0.58, dur: 0.25 }) + 56;
      p.textLink("Open the case study →", p.left, Math.min(y, p.height - 120), project.href, fonts, 19, 0.72);
      if (index === 0) p.text("Hover the screenshot to see it move", p.right, p.height - 46, { family: fonts.serif, size: 20, italic: true, color: MUTED, align: "right" }, { at: 0.85, dur: 0.15 });
    });
  });

  // 15 — commits: the year fills in as a wave, and the count runs up.
  add("Commits", (p) => {
    p.furniture("Signal", folioOf(p), fonts);
    p.kicker("04 — Signal", 150, fonts);
    p.text("A year of commits.", p.left, 236, serif(64, { maxWidth: p.contentWidth }), { at: 0.06, mode: "words", stagger: 0.04 });
    const counted = Math.round((data.contributionCount ?? 0) * p.at(0.25, 0.45));
    p.text(
      data.contributionCount === null
        ? "Public GitHub activity from the last twelve months."
        : `${counted.toLocaleString()} public contributions in the last year. Client and private repository work does not show up here.`,
      p.left,
      320,
      body({ maxWidth: p.contentWidth }),
      { at: 0.2, dur: 0.2 },
    );
    const weeks = Math.max(1, data.weekCount);
    const cell = Math.floor(p.contentWidth / weeks) - 2;
    const levels = ["#e3dccf", "#d7b58c", "#c48c55", "#a8622c", "#6e3a17"];
    const top = 470;
    for (const day of data.days) {
      // A diagonal wave sweeping left to right across the year.
      const a = p.at(0.28 + (day.week / weeks) * 0.4 + day.weekday * 0.008, 0.14);
      if (a <= 0) continue;
      const size = cell * a;
      const cx = p.left + (day.week - 1) * (cell + 2) + cell / 2;
      const cy = top + (day.weekday - 1) * (cell + 2) + cell / 2;
      p.ctx.fillStyle = levels[day.level] ?? levels[0];
      p.ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    }
    const legendY = top + 7 * (cell + 2) + 34;
    p.text("Less", p.left, legendY, { family: fonts.mono, size: 13, color: MUTED }, { at: 0.72, dur: 0.12 });
    levels.forEach((color, level) => {
      const a = p.at(0.74 + level * 0.025, 0.1);
      if (a <= 0) return;
      p.ctx.fillStyle = color;
      p.ctx.fillRect(p.left + 46 + level * 18, legendY - 11, 13 * a, 13 * a);
    });
    p.text("More", p.left + 142, legendY, { family: fonts.mono, size: 13, color: MUTED }, { at: 0.84, dur: 0.12 });
    p.textLink("github.com/Enzizy →", p.left, legendY + 90, "https://github.com/Enzizy", fonts, 19, 0.82);
    p.text("Each square is a day. The darker the ink, the busier the day.", p.left, 900, { family: fonts.serif, size: 24, italic: true, color: MUTED, maxWidth: p.contentWidth }, { at: 0.86, mode: "words", stagger: 0.008, dur: 0.12 });
  });

  // 16 — contact: the address types itself out.
  add("Contact", (p) => {
    p.furniture("Contact", folioOf(p), fonts);
    p.kicker("05 — Contact", 150, fonts);
    const end = p.text("Let's build something that ships.", p.left, 236, serif(70, { maxWidth: p.contentWidth }), { at: 0.06, mode: "words", stagger: 0.04 });
    let y = p.text("Tell me the problem, who it affects, and what a good result looks like. I'll reply with how I'd approach it.", p.left, end + 70, body({ maxWidth: p.contentWidth }), { at: 0.3, dur: 0.22 }) + 80;
    const email = "zhyronnebatican@gmail.com";
    const emailStyle: TextStyle = { family: fonts.sans, size: 26, weight: 600, color: ACCENT };
    const emailWidth = p.measure(email, emailStyle);
    p.link(p.left - 6, y - 30, emailWidth + 12, 42, "mailto:zhyronnebatican@gmail.com", "Email");
    const hovered = p.hoverHref === "mailto:zhyronnebatican@gmail.com";
    if (hovered) {
      p.ctx.fillStyle = "rgba(162, 84, 31, 0.13)";
      p.ctx.beginPath();
      p.ctx.roundRect(p.left - 8, y - 30, emailWidth + 16, 42, 4);
      p.ctx.fill();
    }
    p.text(email, p.left, y, hovered ? { ...emailStyle, color: "#7a3c12" } : emailStyle, { at: 0.45, dur: 0.22, mode: "type" });
    p.ctx.fillStyle = ACCENT;
    p.ctx.fillRect(p.left, y + 7, emailWidth * p.at(0.66, 0.15), hovered ? 2.5 : 1.5);
    y += 90;
    p.rule(y - 40, 0.68);
    [
      ["GitHub", "https://github.com/Enzizy"],
      ["LinkedIn", "https://www.linkedin.com/in/zhyronne-batican-5458a53aa/"],
      ["Facebook", "https://www.facebook.com/Hakdog.Hakplas.Haler"],
      ["Résumé (PDF)", "/resume.pdf"],
    ].forEach(([label, href], index) => {
      p.textLink(`${label} →`, p.left, y, href, fonts, 19, 0.7 + index * 0.05);
      y += 54;
    });
  });

  // 17 — detours
  add("Detours", (p) => {
    p.furniture("Detours", folioOf(p), fonts);
    p.kicker("06 — Detours", 150, fonts);
    p.text("The fun corners of this site.", p.left, 236, serif(58, { maxWidth: p.contentWidth }), { at: 0.06, mode: "words", stagger: 0.035 });
    let y = 400;
    [
      ["Screen Room", "A TMDB catalogue with a player attached.", "/movies"],
      ["Mini Arcade", "Three quick games and one small cat.", "/arcade"],
      ["Every project, as a list", "The same work without the book.", "/projects"],
    ].forEach(([title, line, href], index) => {
      const start = 0.28 + index * 0.12;
      p.rule(y - 40, start - 0.04);
      p.text(title, p.left, y, serif(38), { at: start, dur: 0.18, mode: "chars", stagger: 0.008 });
      p.text(line, p.left, y + 40, body({ size: 18 }), { at: start + 0.06 });
      p.textLink("Open →", p.left, y + 86, href, fonts, 17, start + 0.1);
      y += 170;
    });
    p.text("Other editions", p.left, y + 10, monoLabel(), { at: 0.72, dur: 0.1, mode: "type" });
    let x = p.left;
    [["V1", "/"], ["V2", "/v2"], ["V3", "/v3"], ["V4", "/v4"]].forEach(([label, href], index) => {
      x += p.textLink(label, x, y + 54, href, fonts, 19, 0.75 + index * 0.04) + 30;
    });
  });

  // 18 — colophon: signed by hand, with a nib that moves.
  add("Colophon", (p) => {
    p.furniture("Colophon", folioOf(p), fonts);
    p.text("Colophon", p.left, 400, serif(64), { at: 0.04, mode: "chars", stagger: 0.02 });
    const end = p.text(
      "Designed and built by Zhyronne Batican. Set in Instrument Serif, Geist and JetBrains Mono. Pages, desk and coffee are drawn live in the browser with three.js — no 3D models were downloaded in the making of this book.",
      p.left,
      470,
      body({ maxWidth: p.contentWidth }),
      { at: 0.2, dur: 0.25 },
    );
    const signY = end + 150;
    const signStyle: TextStyle = { family: fonts.serif, size: 72, italic: true, color: "#1c2a4a" };
    const signWidth = p.measure("Zhyronne B.", signStyle);
    const write = p.at(0.5, 0.35);
    if (write > 0) {
      p.ctx.save();
      p.ctx.beginPath();
      p.ctx.rect(p.left - 10, signY - 90, (signWidth + 20) * write, 130);
      p.ctx.clip();
      p.text("Zhyronne B.", p.left, signY, signStyle);
      p.ctx.restore();
      if (write < 1) {
        // The nib, riding the edge of the ink.
        const nx = p.left + signWidth * write;
        p.ctx.fillStyle = "#1c2a4a";
        p.ctx.beginPath();
        p.ctx.moveTo(nx, signY - 18);
        p.ctx.lineTo(nx + 9, signY - 52);
        p.ctx.lineTo(nx + 16, signY - 48);
        p.ctx.closePath();
        p.ctx.fill();
      }
    }
    p.rule(signY + 30, 0.82);
    p.text(`© ${new Date().getFullYear()} · Thanks for reading.`, p.left, signY + 80, { family: fonts.serif, size: 26, italic: true, color: MUTED }, { at: 0.86, dur: 0.12 });
  });

  return { pages, covers: drawCovers(fonts, pixelWidth) };
}

/** The black hardcover, the endpapers inside each board. */
function drawCovers(fonts: BookFonts, pixelWidth: number) {
  const make = () => {
    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = Math.round(pixelWidth * PAGE_RATIO);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(pixelWidth / DESIGN_WIDTH, pixelWidth / DESIGN_WIDTH);
    return { canvas, ctx, w: DESIGN_WIDTH, h: DESIGN_WIDTH * PAGE_RATIO };
  };

  // Front: matte black cloth, the name blind-debossed and picked out in silver.
  const front = make();
  {
    const { ctx, w, h } = front;
    ctx.fillStyle = "#121110";
    ctx.fillRect(0, 0, w, h);
    let seed = 3;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = random() > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.25)";
      ctx.fillRect(random() * w, random() * h, 1.4, 1.4);
    }
    ctx.textAlign = "center";
    ctx.font = `400 150px ${fonts.serif}`;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillText("ZB.", w / 2 + 2, h / 2 + 30);
    ctx.fillStyle = "#cfcac2";
    ctx.fillText("ZB.", w / 2, h / 2 + 28);
    ctx.font = `500 15px ${fonts.mono}`;
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "6px";
    ctx.fillStyle = "#8d877f";
    ctx.fillText("ZHYRONNE BATICAN", w / 2, h / 2 + 100);
    ctx.fillText("PORTFOLIO", w / 2, h - 90);
  }

  // Endpapers: deep green with a fine repeating mark, and a bookplate on each.
  const endpaper = (plateTitle: string, plateLines: string[]) => {
    const sheet = make();
    const { ctx, w, h } = sheet;
    ctx.fillStyle = "#1f2b27";
    ctx.fillRect(0, 0, w, h);
    ctx.font = `400 22px ${fonts.serif}`;
    ctx.fillStyle = "rgba(220, 210, 190, 0.07)";
    ctx.textAlign = "center";
    for (let y = 40; y < h; y += 56) {
      for (let x = (y / 56) % 2 ? 28 : 0; x < w + 40; x += 56) ctx.fillText("zb", x, y);
    }
    const plate = { x: w / 2 - 200, y: h / 2 - 150, w: 400, h: 300 };
    ctx.fillStyle = "#efe8db";
    ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
    ctx.strokeStyle = "#a2541f";
    ctx.lineWidth = 2;
    ctx.strokeRect(plate.x + 14, plate.y + 14, plate.w - 28, plate.h - 28);
    ctx.fillStyle = "#1c1a17";
    ctx.font = `italic 400 44px ${fonts.serif}`;
    ctx.fillText(plateTitle, w / 2, plate.y + 108);
    ctx.font = `400 16px ${fonts.sans}`;
    ctx.fillStyle = "#5b5349";
    plateLines.forEach((line, index) => ctx.fillText(line, w / 2, plate.y + 168 + index * 28));
    return sheet.canvas;
  };

  return {
    front: front.canvas,
    insideFront: endpaper("Ex libris", ["Zhyronne Batican", "Click the right-hand page to turn it."]),
    insideBack: endpaper("Finis", ["Thanks for reading.", "zhyronnebatican@gmail.com"]),
  };
}
