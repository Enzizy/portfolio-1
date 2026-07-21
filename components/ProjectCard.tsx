"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { projects } from "@/data/portfolio";
import { ProjectVisual } from "./ProjectVisual";

type Project = (typeof projects)[number];

export function ProjectCard({ project, contactHref = "#contact" }: { project: Project; contactHref?: string }) {
  return (
    <motion.article className="project-card" data-project-title={project.title} whileHover={{ y: -5 }} transition={{ duration: 0.22 }}>
      <div className="project-info">
        <span>{project.number}</span>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
      </div>
      <div className="project-image"><ProjectVisual variant={project.visual} /></div>
      <div className="project-footer">
        <div>{project.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>
        <a href={contactHref} aria-label={`Ask about ${project.title}`}><ArrowRight size={20} /></a>
      </div>
    </motion.article>
  );
}
