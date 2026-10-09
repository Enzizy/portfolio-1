import { Fraunces, JetBrains_Mono } from "next/font/google";

// A warm, slightly soft serif for headings and every hand-lettered sign in the
// world, and a mono for chart labels and kickers — a travel journal, not a dashboard.
export const displayFont = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  variable: "--v4-font-display",
  display: "swap",
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--v4-font-mono",
  display: "swap",
});
