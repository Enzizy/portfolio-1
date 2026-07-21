import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { projects } from "@/data/portfolio";
import { MotionSection } from "./MotionSection";
import { ProjectCard } from "./ProjectCard";
import { SectionHeading } from "./SectionHeading";

export function Projects() {
  return (
    <MotionSection id="projects" labelledBy="projects-title" className="section projects-section">
      <div className="projects-header">
        <SectionHeading number="02" title="Featured Projects" id="projects-title" />
        <Link href="/projects" data-cat-perch data-cat-zone="projects" data-cat-kind="button">View all projects <ArrowUpRight size={14} /></Link>
      </div>
      <div className="projects-grid">
        {projects.map((project) => <ProjectCard key={project.number} project={project} />)}
      </div>
    </MotionSection>
  );
}
