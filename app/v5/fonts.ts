import { Instrument_Serif, JetBrains_Mono } from "next/font/google";

// A book wants a book face: Instrument Serif for titles and the HUD headline,
// JetBrains Mono for running heads and folios. Body copy is the site's Geist.
export const serifFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--v5-font-serif",
  display: "swap",
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--v5-font-mono",
  display: "swap",
});
