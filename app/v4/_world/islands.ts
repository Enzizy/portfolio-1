// The chart of the archipelago (not a Next.js layout — this folder is private): where every island sits, where a boat parks to visit
// it, and which panel opens there. Plain data with no three.js import, so the HUD (the
// places list, the minimap) can use it before the 3D engine has even loaded.
//
// World units are metres on the sea plane: x runs east, z runs south. The camera
// always looks north, so north is "up" on screen.

import { projects } from "@/data/portfolio";

export type PlaceKind = "home" | "about" | "project" | "services" | "stack" | "signal" | "contact" | "cinema" | "arcade";

export type Place = {
  /** Also the id of the panel this place opens (see the panels in page.tsx). */
  id: string;
  kind: PlaceKind;
  label: string;
  /** Island centre. */
  x: number;
  z: number;
  /** Where "sail here" parks the boat; visiting means being within `reach` of it. */
  dock: [number, number];
  reach: number;
  /** Circles the hull bumps against: [x, z, radius]. */
  colliders: [number, number, number][];
};

export const START = { x: 0, z: 9, heading: 0 };

/** One islet per project, on an arc north-east of the start. */
const PROJECT_ARC = { x: 48, z: -12, radius: 31, from: 158, to: 22 };

export const projectIslets = projects.map((project, index) => {
  const t = index / (projects.length - 1);
  const angle = ((PROJECT_ARC.from + (PROJECT_ARC.to - PROJECT_ARC.from) * t) * Math.PI) / 180;
  const x = PROJECT_ARC.x + Math.cos(angle) * PROJECT_ARC.radius;
  const z = PROJECT_ARC.z - Math.sin(angle) * PROJECT_ARC.radius;
  return { project, index, x, z };
});

/** Optimised screenshots for billboards and the about board (served by next/image). */
export const projectImages: Record<(typeof projects)[number]["visual"], string> = {
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

export function optimisedImage(src: string, width = 640) {
  // q must be one of next.config images.qualities (Next 16 only allows 75 by default).
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

export const places: Place[] = [
  {
    id: "home",
    kind: "home",
    label: "Home",
    x: 0,
    z: -11,
    dock: [0, 3],
    reach: 8,
    colliders: [[-11, -11, 3.6], [-5.5, -11, 3.8], [0, -11, 3.8], [5.5, -11, 3.8], [11, -11, 3.6]],
  },
  {
    id: "about",
    kind: "about",
    label: "About",
    x: -40,
    z: -18,
    dock: [-32, -5],
    reach: 7,
    colliders: [[-40, -18, 9]],
  },
  ...projectIslets.map<Place>(({ project, index, x, z }) => ({
    id: `project-${index}`,
    kind: "project",
    label: project.title,
    x,
    z,
    dock: [x, z + 7],
    reach: 4.4,
    colliders: [[x, z, 3.6]],
  })),
  {
    id: "services",
    kind: "services",
    label: "Services",
    x: -42,
    z: 30,
    dock: [-42, 44],
    reach: 7,
    colliders: [[-42, 30, 10.5]],
  },
  {
    id: "stack",
    kind: "stack",
    label: "Stack",
    x: 38,
    z: 32,
    dock: [38, 32],
    reach: 11,
    colliders: [],
  },
  {
    id: "signal",
    kind: "signal",
    label: "Commits",
    x: 0,
    z: 60,
    // Moored on the north side: every route here arrives from the north.
    dock: [0, 50],
    reach: 8,
    colliders: [-22, -15, -8, 0, 8, 15, 22].map((x) => [x, 60, 4.2] as [number, number, number]),
  },
  {
    id: "contact",
    kind: "contact",
    label: "Contact",
    x: 70,
    z: 6,
    dock: [63, 16],
    reach: 6.5,
    colliders: [[70, 6, 6.5]],
  },
  {
    id: "cinema",
    kind: "cinema",
    label: "Screen Room",
    x: -70,
    z: 6,
    dock: [-63, 15],
    reach: 6,
    colliders: [[-70, 6, 6]],
  },
  {
    id: "arcade",
    kind: "arcade",
    label: "Mini Arcade",
    x: -8,
    z: 34,
    dock: [-8, 41],
    reach: 5,
    colliders: [[-8, 34, 3.4]],
  },
];

/** The places list in the HUD: one entry per island, projects collapsed into one. */
export const destinations = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "project-0", label: "Projects" },
  { id: "services", label: "Services" },
  { id: "stack", label: "Stack" },
  { id: "signal", label: "Commits" },
  { id: "contact", label: "Contact" },
] as const;

export const placeById = new Map(places.map((place) => [place.id, place]));

/** The sea is bounded so nobody sails off the chart. */
export const SEA_RADIUS = 112;

/** Chart extents for the minimap, padded around every island. */
export const CHART = { minX: -88, maxX: 88, minZ: -60, maxZ: 84 };
