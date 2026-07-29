import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { projects } from "@/data/portfolio";

export function ProjectNavigation({ currentHref }: { currentHref: string }) {
  const currentIndex = projects.findIndex((project) => project.href === currentHref);
  if (currentIndex === -1) return null;

  const previous = projects[(currentIndex - 1 + projects.length) % projects.length];
  const next = projects[(currentIndex + 1) % projects.length];

  return (
    <nav className="project-navigation" aria-label="More project case studies">
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
