// V3 lays the portfolio out in space instead of in a column. Every station has a fixed
// position on a 5540 x 3780 "drafting table"; the viewport is a camera that flies over it.
// Widths are authored here, heights are measured at runtime (content decides them).

export type StationId = "identity" | "about" | "services" | "projects" | "skills" | "signal" | "contact" | "detours";

export type Station = {
  id: StationId;
  /** Two-digit index shown on the plate and in the rail. */
  code: string;
  label: string;
  /** Short line used by the rail and the minimap tooltip. */
  hint: string;
  x: number;
  y: number;
  w: number;
};

export const WORLD = { w: 5540, h: 3780 };

export const stations: Station[] = [
  { id: "identity", code: "00", label: "Origin", hint: "Who you just landed on", x: 1960, y: 1420, w: 900 },
  { id: "contact", code: "06", label: "Signal out", hint: "Start a conversation", x: 1660, y: 320, w: 1180 },
  { id: "about", code: "01", label: "About", hint: "How I work", x: 520, y: 560, w: 800 },
  { id: "services", code: "02", label: "Services", hint: "What I can build", x: 400, y: 1640, w: 900 },
  { id: "projects", code: "03", label: "Projects", hint: "Nine things I shipped", x: 3120, y: 320, w: 1900 },
  { id: "skills", code: "04", label: "Toolbox", hint: "The stack behind it", x: 3240, y: 2420, w: 1100 },
  { id: "signal", code: "05", label: "Commits", hint: "A year of GitHub activity", x: 1760, y: 2520, w: 1260 },
  { id: "detours", code: "07", label: "Detours", hint: "The fun corners of this site", x: 520, y: 3020, w: 1000 },
];

/** Rail/keyboard order — the intended reading route, which is not the render order. */
export const routeOrder: StationId[] = ["identity", "about", "services", "projects", "skills", "signal", "contact", "detours"];

export const routeStations = routeOrder.map((id) => stations.find((station) => station.id === id)!);

/**
 * Hand-authored elbow polylines, drawn behind the plates. Each entry is a flat list of
 * world points; the gaps between them are deliberate so no line runs under a station.
 */
export const connectors: number[][] = [
  [2410, 1420, 2410, 1140],
  [1960, 1700, 1560, 1700, 1560, 1100, 1320, 1100],
  [1960, 1950, 1560, 1950, 1560, 2120, 1300, 2120],
  [2860, 1700, 2990, 1700, 2990, 1270, 3120, 1270],
  [2860, 1950, 3090, 1950, 3090, 2870, 3240, 2870],
  [2410, 2180, 2410, 2520],
  [850, 2840, 850, 3020],
];

/** Small non-interactive map furniture: survey marks that sell the drafting-table idea. */
export const surveyMarks: Array<{ x: number; y: number; label: string }> = [
  { x: 1500, y: 300, label: "N" },
  { x: 5180, y: 2600, label: "E" },
  { x: 3000, y: 3560, label: "S" },
  { x: 220, y: 1400, label: "W" },
];
