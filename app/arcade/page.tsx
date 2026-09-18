import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { ArcadeHub } from "./ArcadeHub";
import "./arcade.css";

export const metadata: Metadata = {
  title: "Mini Arcade — Zhyronne Batican",
  description: "Take a short break with Typing Sprint, a daily five-letter puzzle, and Cat Runner.",
  alternates: { canonical: "/arcade" },
};

export default function ArcadePage() {
  return <><Navigation /><main id="main-content" className="arcade-page" tabIndex={-1}><ArcadeHub /></main><Footer /></>;
}
