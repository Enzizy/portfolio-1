import { ArrowUpRight, CircleDot } from "lucide-react";
import Link from "next/link";
import { MotionSection } from "./MotionSection";
import { SectionHeading } from "./SectionHeading";

export function Currently() {
  return (
    <MotionSection id="currently" labelledBy="currently-title" className="section currently-section">
      <SectionHeading number="05" title="Currently" id="currently-title" />
      <div className="currently-copy">
        <span><CircleDot size={13} /> NOW</span>
        <h2>Building thoughtful AI tools and full-stack business platforms.</h2>
        <p>
          Exploring local-first AI workflows, dependable business automation,
          and product experiences that make complex work feel simple.
        </p>
      </div>
      <div className="currently-status">
        <span>AVAILABILITY</span>
        <strong>Open to selected freelance projects</strong>
        <Link href="#contact">Start a conversation <ArrowUpRight size={14} /></Link>
      </div>
    </MotionSection>
  );
}
