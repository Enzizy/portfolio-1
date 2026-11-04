import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Navigation } from "@/components/Navigation";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/data/portfolio";
import { createPageMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Projects: Web, Mobile & AI Case Studies | Zhyronne Batican",
  description:
    "Case studies of web apps, HR and accounting systems, WordPress sites, mobile apps, desktop tools, and AI products built by Zhyronne Batican.",
  path: "/projects",
});

const projectsSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${siteUrl}/projects#page`,
  url: `${siteUrl}/projects`,
  name: "Projects by Zhyronne Batican",
  about: { "@id": `${siteUrl}/#person` },
  isPartOf: { "@id": `${siteUrl}/#website` },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: project.title,
      url: `${siteUrl}${project.href}`,
    })),
  },
};

export default function AllProjectsPage() {
  return (
    <>
      <JsonLd data={projectsSchema} />
      <Navigation />
      <main id="main-content" className="page-shell projects-page" tabIndex={-1}>
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
              <ProjectCard key={project.number} project={project} />
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
