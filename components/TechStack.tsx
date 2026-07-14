import { stackGroups } from "@/data/portfolio";
import { MotionSection } from "./MotionSection";
import { SectionHeading } from "./SectionHeading";

export function TechStack() {
  return (
    <MotionSection id="skills" labelledBy="skills-title" className="section stack-section">
      <SectionHeading number="03" title="Tech Stack" id="skills-title" />
      <div className="stack-grid">
        {stackGroups.map((group) => (
          <div key={group.title} className="stack-group">
            <h3>{group.title}</h3>
            <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ))}
      </div>
    </MotionSection>
  );
}
