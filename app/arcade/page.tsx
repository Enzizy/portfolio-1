import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { createPageMetadata } from "@/lib/metadata";
import { ArcadeHub } from "./ArcadeHub";
import "./arcade.css";

export const metadata = createPageMetadata({
  title: "Mini Arcade — Zhyronne Batican",
  description: "Take a short break with Typing Sprint, a daily five-letter puzzle, and Cat Runner.",
  path: "/arcade",
});

export default function ArcadePage() {
  return <><Navigation /><main id="main-content" className="arcade-page" tabIndex={-1}><ArcadeHub /></main><Footer /></>;
}
