import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

// V3 gets its own voice: a technical grotesque for the plates and a true mono for
// every code, coordinate and HUD readout. Self-hosted by next/font, so no CDN at runtime.
export const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--v3-font-display",
  display: "swap",
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--v3-font-mono",
  display: "swap",
});
