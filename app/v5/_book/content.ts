// The pages of the book, drawn on canvases. Each page records its clickable link
// regions and, for projects, the screenshot rectangle that comes alive on hover —
// both in normalised page coordinates (0..1 from the top-left), so the 3D scene can
// map a raycast UV straight onto them.

import { projects, services, stackGroups } from "@/data/portfolio";

export type PageRect = { x: number; y: number; w: number; h: number };
export type PageLink = PageRect & { href: string; label: string };
export type PageMotion = PageRect & { src: string };
export type BookPage = { label: string; canvas: HTMLCanvasElement; links: PageLink[]; motion?: PageMotion };
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
  roarly: "/images/projects/roarly.png",
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

  constructor(pixelWidth: number, readonly side: "left" | "right") {
    this.canvas = document.createElement("canvas");
    this.canvas.width = pixelWidth;
    this.canvas.height = Math.round(pixelWidth * PAGE_RATIO);
    this.ctx = this.canvas.getContext("2d")!;
    this.scale = pixelWidth / DESIGN_WIDTH;
    this.ctx.scale(this.scale, this.scale);
    this.left = side === "right" ? 88 : 64;
    this.right = this.width - (side === "right" ? 64 : 88);
  }

  get contentWidth() {
    return this.right - this.left;
  }

  /** Paper, a faint grain, and the shadow that pools in the gutter. */
  paper(color = PAPER) {
    const { ctx, width, height } = this;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    let seed = this.side === "right" ? 7 : 13;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    ctx.fillStyle = "rgba(60, 45, 30, 0.035)";
    for (let i = 0; i < 2600; i++) ctx.fillRect(random() * width, random() * height, 1.2, 1.2);
    const gutter = this.side === "right" ? ctx.createLinearGradient(0, 0, 70, 0) : ctx.createLinearGradient(width, 0, width - 70, 0);
    gutter.addColorStop(0, "rgba(40, 28, 16, 0.22)");
    gutter.addColorStop(1, "rgba(40, 28, 16, 0)");
    ctx.fillStyle = gutter;
    ctx.fillRect(0, 0, width, height);
  }

  text(value: string, x: number, y: number, style: TextStyle) {
    const { ctx } = this;
    const lineHeight = (style.lineHeight ?? 1.3) * style.size;
    ctx.font = `${style.italic ? "italic " : ""}${style.weight ?? 400} ${style.size}px ${style.family}`;
    ctx.fillStyle = style.color ?? INK;
    ctx.textAlign = style.align ?? "left";
    ctx.textBaseline = "alphabetic";
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${style.spacing ?? 0}px`;
    const content = style.upper ? value.toUpperCase() : value;
    const maxWidth = style.maxWidth ?? Infinity;
    let cursor = y;
    for (const paragraph of content.split("\n")) {
      let line = "";
      for (const word of paragraph.split(" ")) {
        const attempt = line ? `${line} ${word}` : word;
        if (ctx.measureText(attempt).width > maxWidth && line) {
          ctx.fillText(line, x, cursor);
          cursor += lineHeight;
          line = word;
        } else {
          line = attempt;
        }
      }
      ctx.fillText(line, x, cursor);
      cursor += lineHeight;
    }
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
    return cursor - lineHeight;
  }

  measure(value: string, style: TextStyle) {
    this.ctx.font = `${style.italic ? "italic " : ""}${style.weight ?? 400} ${style.size}px ${style.family}`;
    return this.ctx.measureText(value).width;
  }

  rule(y: number, color = "rgba(28, 26, 23, 0.16)") {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.left, y, this.contentWidth, 1);
  }

  /** Records a clickable region (design units) on the page. */
  link(x: number, y: number, w: number, h: number, href: string, label: string) {
    this.links.push({ x: x / this.width, y: y / this.height, w: w / this.width, h: h / this.height, href, label });
  }

  /** An underlined text link, with its click region recorded. */
  textLink(label: string, x: number, y: number, href: string, fonts: BookFonts, size = 17) {
    const style: TextStyle = { family: fonts.sans, size, weight: 600, color: ACCENT };
    const width = this.measure(label, style);
    this.text(label, x, y, style);
    this.ctx.fillStyle = ACCENT;
    this.ctx.fillRect(x, y + 5, width, 1.5);
    this.link(x - 6, y - size - 4, width + 12, size + 16, href, label);
    return width;
  }

  /** Cover-fits an image, cropped from the top so screenshots show their header. */
  image(image: HTMLImageElement | undefined, x: number, y: number, w: number, h: number, radius = 6) {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.clip();
    ctx.fillStyle = "#d9d3c8";
    ctx.fillRect(x, y, w, h);
    if (image?.naturalWidth) {
      const target = w / h;
      const source = image.naturalWidth / image.naturalHeight;
      if (source > target) {
        const sw = image.naturalHeight * target;
        ctx.drawImage(image, (image.naturalWidth - sw) / 2, 0, sw, image.naturalHeight, x, y, w, h);
      } else {
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalWidth / target, x, y, w, h);
      }
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(28, 26, 23, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, radius);
    ctx.stroke();
  }

  /** Running head and folio, like a printed book. */
  furniture(section: string, folio: number, fonts: BookFonts) {
    const mono: TextStyle = { family: fonts.mono, size: 13, color: MUTED, spacing: 2, upper: true };
    const outer = this.side === "right" ? this.right : this.left;
    const inner = this.side === "right" ? this.left : this.right;
    this.text("Zhyronne Batican", inner, 58, { ...mono, align: this.side === "right" ? "left" : "right" });
    this.text(section, outer, 58, { ...mono, align: this.side === "right" ? "right" : "left" });
    this.text(String(folio).padStart(2, "0"), outer, this.height - 46, { ...mono, size: 14, align: this.side === "right" ? "right" : "left" });
  }

  kicker(value: string, y: number, fonts: BookFonts) {
    return this.text(value, this.left, y, { family: fonts.mono, size: 15, color: ACCENT, spacing: 2.4, upper: true });
  }

  done(label: string): BookPage {
    return { label, canvas: this.canvas, links: this.links, motion: this.motion };
  }
}

/** Draws every page of the book (in reading order) plus the cover art. */
export function buildBook(fonts: BookFonts, images: Map<string, HTMLImageElement>, data: BookData, pixelWidth: number) {
  const pages: BookPage[] = [];
  const serif = (size: number, extra: Partial<TextStyle> = {}): TextStyle => ({ family: fonts.serif, size, color: INK, lineHeight: 1.02, ...extra });
  const body = (extra: Partial<TextStyle> = {}): TextStyle => ({ family: fonts.sans, size: 21, color: BODY, lineHeight: 1.55, ...extra });
  const side = () => (pages.length % 2 === 0 ? "right" : "left") as "left" | "right";
  const page = () => new Page(pixelWidth, side());
  const folio = () => pages.length + 1;

  // 1 — title page
  {
    const p = page();
    p.paper();
    p.text("A portfolio in print", p.left, 150, { family: fonts.mono, size: 13, color: ACCENT, spacing: 2.4, upper: true });
    p.text("Zhyronne\nBatican", p.left - 4, 300, serif(128, { lineHeight: 0.92 }));
    p.rule(560);
    p.text("Full-stack developer · AI engineer · UI/UX designer", p.left, 604, body({ size: 19, color: INK, maxWidth: p.contentWidth }));
    p.text("Custom web apps, WordPress sites, landing pages, mobile tools and AI-assisted workflows — built in the Philippines for teams anywhere.", p.left, 650, body({ maxWidth: p.contentWidth - 40 }));
    p.text("Selected work · 2024 – 2026", p.left, 860, { family: fonts.mono, size: 13, color: MUTED, spacing: 2, upper: true });
    p.text("Click this page to turn it →", p.right, p.height - 46, { family: fonts.serif, size: 22, italic: true, color: MUTED, align: "right" });
    pages.push(p.done("Title"));
  }

  // 2 — about
  {
    const p = page();
    p.paper();
    p.furniture("About", folio(), fonts);
    p.kicker("01 — About", 150, fonts);
    const end = p.text("I turn ideas into products people actually use.", p.left, 236, serif(64, { maxWidth: p.contentWidth }));
    let y = end + 70;
    for (const paragraph of [
      "I'm a freelance full-stack developer building web apps, WordPress websites, landing pages, mobile tools, and AI-assisted experiences.",
      "From focused business pages to custom software and automation, I enjoy turning ideas into products that are simple, efficient, and useful.",
      "I keep exploring emerging technology in artificial intelligence, automation, and interactive web experiences — this book is one of those experiments.",
    ]) {
      y = p.text(paragraph, p.left, y, body({ maxWidth: p.contentWidth })) + 46;
    }
    pages.push(p.done("About"));
  }

  // 3 — portrait
  {
    const p = page();
    p.paper();
    p.furniture("About", folio(), fonts);
    p.image(images.get("/images/me.jpg"), p.left, 110, p.contentWidth, 640, 4);
    p.text("Fig. 1 — The author, somewhere between a deploy and a coffee.", p.left, 784, { family: fonts.serif, size: 20, italic: true, color: MUTED, maxWidth: p.contentWidth });
    p.rule(840);
    p.text("Based in", p.left, 884, { family: fonts.mono, size: 12, color: MUTED, spacing: 2, upper: true });
    p.text("Philippines · remote-friendly", p.left, 914, body({ color: INK }));
    p.text("Status", p.left + 330, 884, { family: fonts.mono, size: 12, color: MUTED, spacing: 2, upper: true });
    p.ctx.fillStyle = "#3f8a5a";
    p.ctx.beginPath();
    p.ctx.arc(p.left + 336, 908, 5, 0, Math.PI * 2);
    p.ctx.fill();
    p.text("Taking on freelance work", p.left + 350, 914, body({ color: INK }));
    p.textLink("Download the résumé →", p.left, 980, "/resume.pdf", fonts);
    pages.push(p.done("About"));
  }

  // 4 — services
  {
    const p = page();
    p.paper();
    p.furniture("Services", folio(), fonts);
    p.kicker("02 — Services", 150, fonts);
    p.text("What we can build together.", p.left, 236, serif(58, { maxWidth: p.contentWidth }));
    let y = 372;
    services.forEach((service, index) => {
      p.rule(y - 34);
      p.text(String(index + 1).padStart(2, "0"), p.left, y, { family: fonts.mono, size: 13, color: ACCENT, spacing: 1 });
      p.text(service.title, p.left + 56, y + 4, serif(32));
      y = p.text(service.description, p.left + 56, y + 40, body({ size: 18, maxWidth: p.contentWidth - 56 })) + 54;
    });
    pages.push(p.done("Services"));
  }

  // 5 — stack
  {
    const p = page();
    p.paper();
    p.furniture("Toolbox", folio(), fonts);
    p.kicker("03 — Toolbox", 150, fonts);
    p.text("Chosen per product, not per habit.", p.left, 236, serif(58, { maxWidth: p.contentWidth }));
    let y = 410;
    for (const group of stackGroups) {
      p.text(group.title, p.left, y, { family: fonts.mono, size: 14, color: MUTED, spacing: 2, upper: true });
      y = p.text(group.items.join(" · "), p.left, y + 36, { family: fonts.serif, size: 27, color: INK, lineHeight: 1.25, maxWidth: p.contentWidth }) + 66;
    }
    pages.push(p.done("Toolbox"));
  }

  // 6–14 — one project per page
  projects.forEach((project, index) => {
    const p = page();
    p.paper();
    p.furniture("Selected work", folio(), fonts);
    p.kicker(`Project ${project.number} / ${String(projects.length).padStart(2, "0")}`, 132, fonts);
    // Screenshots sit on a dark ink plate with a soft shadow, so light-themed apps
    // keep a hard edge against cream paper instead of dissolving into it.
    const plate = { x: p.left, y: 158, w: p.contentWidth, h: Math.round(p.contentWidth * 0.68) + 28 };
    p.ctx.save();
    p.ctx.shadowColor = "rgba(40, 28, 16, 0.32)";
    p.ctx.shadowBlur = 22;
    p.ctx.shadowOffsetY = 8;
    p.ctx.fillStyle = "#1f1c19";
    p.ctx.beginPath();
    p.ctx.roundRect(plate.x, plate.y, plate.w, plate.h, 8);
    p.ctx.fill();
    p.ctx.restore();
    const shot = { x: plate.x + 14, y: plate.y + 14, w: plate.w - 28, h: plate.h - 28 };
    const src = projectShots[project.visual];
    p.image(images.get(src), shot.x, shot.y, shot.w, shot.h, 4);
    p.motion = { src, x: shot.x / p.width, y: shot.y / p.height, w: shot.w / p.width, h: shot.h / p.height };
    let y = plate.y + plate.h + 84;
    y = p.text(project.title, p.left, y, serif(62, { maxWidth: p.contentWidth })) + 42;
    p.text(project.technologies.join(" · "), p.left, y, { family: fonts.mono, size: 15, color: ACCENT, spacing: 1.5, upper: true });
    y = p.text(project.description, p.left, y + 44, body({ size: 21, maxWidth: p.contentWidth })) + 56;
    p.textLink("Open the case study →", p.left, Math.min(y, p.height - 120), project.href, fonts);
    p.text(index === 0 ? "Hover the screenshot to see it move" : "", p.right, p.height - 46, { family: fonts.serif, size: 18, italic: true, color: MUTED, align: "right" });
    pages.push(p.done(project.title));
  });

  // 15 — commits
  {
    const p = page();
    p.paper();
    p.furniture("Signal", folio(), fonts);
    p.kicker("04 — Signal", 150, fonts);
    p.text("A year of commits.", p.left, 236, serif(64, { maxWidth: p.contentWidth }));
    p.text(
      data.contributionCount === null
        ? "Public GitHub activity from the last twelve months."
        : `${data.contributionCount.toLocaleString()} public contributions in the last year. Client and private repository work does not show up here.`,
      p.left,
      320,
      body({ maxWidth: p.contentWidth }),
    );
    const weeks = Math.max(1, data.weekCount);
    const cell = Math.floor(p.contentWidth / weeks) - 2;
    const levels = ["#e3dccf", "#d7b58c", "#c48c55", "#a8622c", "#6e3a17"];
    for (const day of data.days) {
      p.ctx.fillStyle = levels[day.level] ?? levels[0];
      p.ctx.fillRect(p.left + (day.week - 1) * (cell + 2), 460 + (day.weekday - 1) * (cell + 2), cell, cell);
    }
    p.text("Less", p.left, 460 + 7 * (cell + 2) + 34, { family: fonts.mono, size: 11, color: MUTED });
    levels.forEach((color, level) => {
      p.ctx.fillStyle = color;
      p.ctx.fillRect(p.left + 44 + level * 16, 460 + 7 * (cell + 2) + 24, 11, 11);
    });
    p.text("More", p.left + 132, 460 + 7 * (cell + 2) + 34, { family: fonts.mono, size: 11, color: MUTED });
    p.textLink("github.com/Enzizy →", p.left, 700, "https://github.com/Enzizy", fonts);
    p.text("Each square is a day. The darker the ink, the busier the day.", p.left, 900, { family: fonts.serif, size: 22, italic: true, color: MUTED, maxWidth: p.contentWidth });
    pages.push(p.done("Commits"));
  }

  // 16 — contact
  {
    const p = page();
    p.paper();
    p.furniture("Contact", folio(), fonts);
    p.kicker("05 — Contact", 150, fonts);
    const end = p.text("Let's build something that ships.", p.left, 236, serif(70, { maxWidth: p.contentWidth }));
    let y = p.text("Tell me the problem, who it affects, and what a good result looks like. I'll reply with how I'd approach it.", p.left, end + 70, body({ maxWidth: p.contentWidth })) + 80;
    p.textLink("zhyronnebatican@gmail.com", p.left, y, "mailto:zhyronnebatican@gmail.com", fonts, 24);
    y += 90;
    p.rule(y - 40);
    for (const [label, href] of [
      ["GitHub", "https://github.com/Enzizy"],
      ["LinkedIn", "https://www.linkedin.com/in/zhyronne-batican-5458a53aa/"],
      ["Facebook", "https://www.facebook.com/Hakdog.Hakplas.Haler"],
      ["Résumé (PDF)", "/resume.pdf"],
    ]) {
      p.textLink(`${label} →`, p.left, y, href, fonts);
      y += 52;
    }
    pages.push(p.done("Contact"));
  }

  // 17 — detours
  {
    const p = page();
    p.paper();
    p.furniture("Detours", folio(), fonts);
    p.kicker("06 — Detours", 150, fonts);
    p.text("The fun corners of this site.", p.left, 236, serif(58, { maxWidth: p.contentWidth }));
    let y = 400;
    for (const [title, line, href] of [
      ["Screen Room", "A TMDB catalogue with a player attached.", "/movies"],
      ["Mini Arcade", "Three quick games and one small cat.", "/arcade"],
      ["Every project, as a list", "The same work without the book.", "/projects"],
    ]) {
      p.rule(y - 40);
      p.text(title, p.left, y, serif(36));
      p.text(line, p.left, y + 38, body({ size: 16 }));
      p.textLink("Open →", p.left, y + 82, href, fonts, 16);
      y += 170;
    }
    p.text("Other editions", p.left, y + 10, { family: fonts.mono, size: 12, color: MUTED, spacing: 2, upper: true });
    let x = p.left;
    for (const [label, href] of [["V1", "/"], ["V2", "/v2"], ["V3", "/v3"], ["V4", "/v4"]]) {
      x += p.textLink(label, x, y + 52, href, fonts, 18) + 28;
    }
    pages.push(p.done("Detours"));
  }

  // 18 — colophon
  {
    const p = page();
    p.paper();
    p.furniture("Colophon", folio(), fonts);
    p.text("Colophon", p.left, 430, serif(64));
    p.text(
      "Designed and built by Zhyronne Batican. Set in Instrument Serif, Geist and JetBrains Mono. Pages, desk and coffee are drawn live in the browser with three.js — no 3D models were downloaded in the making of this book.",
      p.left,
      500,
      body({ maxWidth: p.contentWidth }),
    );
    p.text(`© ${new Date().getFullYear()} · Thanks for reading.`, p.left, 760, { family: fonts.serif, size: 24, italic: true, color: MUTED });
    pages.push(p.done("Colophon"));
  }

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
