import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";

// A grotesque with real character at display sizes, and a mono for the small
// labels, counters and index numbers that give a studio site its rhythm.
export const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--v4-display",
  display: "swap",
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--v4-mono",
  display: "swap",
});
