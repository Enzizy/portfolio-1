import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { projects } from "@/data/portfolio";
import { shareImageFor } from "@/lib/metadata";
import { siteUrl } from "@/lib/site";
import { JsonLd } from "./JsonLd";

export function ProjectNavigation({ currentHref }: { currentHref: string }) {
  const currentIndex = projects.findIndex((project) => project.href === currentHref);
  if (currentIndex === -1) return null;

  const current = projects[currentIndex];
  const previous = projects[(currentIndex - 1 + projects.length) % projects.length];
  const next = projects[(currentIndex + 1) % projects.length];
  const url = `${siteUrl}${current.href}`;

  return (
    <nav className="project-navigation" aria-label="More project case studies">
      {/* Every case study renders this, so the project's structured data lives in one place. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CreativeWork",
              "@id": `${url}#project`,
              name: current.title,
              description: current.description,
              url,
              image: `${siteUrl}${shareImageFor(current.href)}`,
              keywords: [...current.technologies],
              creator: { "@id": `${siteUrl}/#person` },
              isPartOf: { "@id": `${siteUrl}/#website` },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
                { "@type": "ListItem", position: 2, name: "Projects", item: `${siteUrl}/projects` },
                { "@type": "ListItem", position: 3, name: current.title, item: url },
              ],
            },
          ],
        }}
      />
      <Link href={previous.href}>
        <ArrowLeft size={16} />
        <span><small>Previous project</small><strong>{previous.title}</strong></span>
      </Link>
      <Link href="/projects" className="project-navigation__all">All projects</Link>
      <Link href={next.href}>
        <span><small>Next project</small><strong>{next.title}</strong></span>
        <ArrowRight size={16} />
      </Link>
    </nav>
  );
}
