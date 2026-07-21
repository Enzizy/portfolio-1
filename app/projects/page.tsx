import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/data/portfolio";

export const metadata: Metadata = {
  title: "Projects — Zhyronne Batican",
  description: "Explore selected web, mobile, AI, and product design projects by Zhyronne Batican.",
};

export default function AllProjectsPage() {
  return (
    <>
      <Navigation />
      <main id="top" className="page-shell projects-page">
        <header className="projects-page__hero">
          <div>
            <p className="eyebrow">// SELECTED WORK</p>
            <h1>All Projects</h1>
          </div>
          <div className="projects-page__intro">
            <p>
              A collection of purposeful digital products spanning AI, mobile applications,
              business platforms, and high-performing web experiences.
            </p>
            <Link href="/#projects"><ArrowLeft size={14} /> Back to portfolio</Link>
          </div>
        </header>

        <section className="projects-page__catalog" aria-labelledby="projects-catalog-title">
          <div className="projects-page__label">
            <span>// 01</span>
            <h2 id="projects-catalog-title">Project Archive</h2>
            <p>{projects.length.toString().padStart(2, "0")} projects</p>
          </div>
          <div className="projects-page__grid">
            {projects.map((project) => (
              <ProjectCard key={project.number} project={project} contactHref="/#contact" />
            ))}
          </div>
        </section>

        <section className="projects-page__cta" aria-labelledby="projects-cta-title">
          <div>
            <span>// HAVE A PROJECT IN MIND?</span>
            <h2 id="projects-cta-title">Let&apos;s create something thoughtful.</h2>
          </div>
          <Link className="button button--dark" href="/#contact">
            Start a conversation <ArrowUpRight size={15} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
