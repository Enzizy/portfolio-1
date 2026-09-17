import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CaseStudyStory, type CaseStudyStoryDetails } from "@/components/CaseStudyStory";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";

export type PrivateProjectDetails = {
  number: string;
  title: string;
  category: string;
  introduction: string;
  role: string;
  platform: string;
  coreStack: string;
  image: string;
  imageAlt: string;
  imageNote: string;
  imageFit?: "contain" | "cover" | "mobile";
  additionalImages?: readonly { src: string; alt: string }[];
  story: CaseStudyStoryDetails;
  features: readonly string[];
  architecture: readonly { label: string; value: string }[];
  href: string;
};

export function PrivateProjectCaseStudy({ project }: { project: PrivateProjectDetails }) {
  const sectionId = project.href.split("/").at(-1);
  const screenshots = [{ src: project.image, alt: project.imageAlt }, ...(project.additionalImages ?? [])];

  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell case-study" tabIndex={-1}>
        <header className="case-study__header">
          <Link className="case-study__back" href="/projects">
            <ArrowLeft size={14} /> All projects
          </Link>
          <p className="eyebrow">// CASE STUDY {project.number}</p>
          <div className="case-study__title">
            <div>
              <span>{project.category}</span>
              <h1>{project.title}</h1>
            </div>
            <p>{project.introduction}</p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>{project.role}</dd></div>
            <div><dt>Platform</dt><dd>{project.platform}</dd></div>
            <div><dt>Core stack</dt><dd>{project.coreStack}</dd></div>
          </dl>
        </header>

        <figure className={`case-study__hero case-study__hero--captioned${project.imageFit === "cover" ? " case-study__hero--screenshot" : ""}${project.imageFit === "mobile" ? " case-study__hero--mobile-screens" : ""}`}>
          {project.imageFit === "mobile" ? (
            <div className="case-study__mobile-shots">
              {screenshots.map(({ src, alt }, index) => (
                <Image key={src} src={src} alt={alt} width={430} height={930} sizes="(max-width: 640px) 72vw, 280px" priority={index === 0} />
              ))}
            </div>
          ) : (
            <Image
              src={project.image}
              alt={project.imageAlt}
              width={1200}
              height={640}
              sizes="(max-width: 948px) calc(100vw - 48px), 900px"
              priority
            />
          )}
          <figcaption>{project.imageNote}</figcaption>
        </figure>

        <CaseStudyStory id={`${sectionId}-story`} story={project.story} />

        <section className="case-study__features" aria-labelledby={`${sectionId}-features`}>
          <div className="case-study__section-heading">
            <span>// 02</span><h2 id={`${sectionId}-features`}>Key capabilities</h2>
          </div>
          <ul>
            {project.features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__technology" aria-labelledby={`${sectionId}-technology`}>
          <div className="case-study__section-heading">
            <span>// 03</span><h2 id={`${sectionId}-technology`}>Architecture</h2>
          </div>
          <dl>
            {project.architecture.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby={`${sectionId}-cta`}>
          <div>
            <span>// BUILD SOMETHING USEFUL</span>
            <h2 id={`${sectionId}-cta`}>Have a product idea of your own?</h2>
          </div>
          <Link className="button button--dark" href="/#contact">
            Let&apos;s work together <ArrowUpRight size={15} />
          </Link>
        </section>
        <ProjectNavigation currentHref={project.href} />
      </main>
      <Footer />
    </>
  );
}
