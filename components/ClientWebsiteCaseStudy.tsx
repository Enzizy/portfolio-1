import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, ExternalLink } from "lucide-react";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";
import { ProjectNavigation } from "./ProjectNavigation";

type CaseStudyItem = { label: string; value: string };

type ClientWebsiteCaseStudyProps = {
  number: string;
  title: string;
  category: string;
  introduction: string;
  image: string;
  imageAlt: string;
  liveUrl: string;
  currentHref: string;
  overview: readonly string[];
  features: readonly string[];
  details: readonly CaseStudyItem[];
};

export function ClientWebsiteCaseStudy({
  number,
  title,
  category,
  introduction,
  image,
  imageAlt,
  liveUrl,
  currentHref,
  overview,
  features,
  details,
}: ClientWebsiteCaseStudyProps) {
  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell case-study" tabIndex={-1}>
        <header className="case-study__header">
          <Link className="case-study__back" href="/projects">
            <ArrowLeft size={14} /> All projects
          </Link>
          <p className="eyebrow">// CASE STUDY {number}</p>
          <div className="case-study__title">
            <div>
              <span>{category}</span>
              <h1>{title}</h1>
            </div>
            <p>{introduction}</p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>WordPress development</dd></div>
            <div><dt>Project type</dt><dd>Client business website</dd></div>
            <div><dt>Focus</dt><dd>Responsive design · Content · Conversion</dd></div>
          </dl>
        </header>

        <figure className="case-study__hero">
          <Image
            src={image}
            alt={imageAlt}
            width={1424}
            height={762}
            sizes="(max-width: 948px) calc(100vw - 48px), 900px"
            priority
          />
        </figure>

        <section className="case-study__overview" aria-labelledby={`${number}-overview`}>
          <div>
            <span>// 01</span>
            <h2 id={`${number}-overview`}>Overview</h2>
          </div>
          <div>
            {overview.map((paragraph, index) => (
              <p className={index === 0 ? "case-study__lead" : undefined} key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="case-study__features" aria-labelledby={`${number}-features`}>
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id={`${number}-features`}>Website experience</h2>
            <p>Public-facing features verified from the live client website.</p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__technology" aria-labelledby={`${number}-delivery`}>
          <div className="case-study__section-heading">
            <span>// 03</span>
            <h2 id={`${number}-delivery`}>Delivery</h2>
            <p>Structured to present the business clearly and turn visitor interest into inquiries.</p>
          </div>
          <dl>
            {details.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby={`${number}-cta`}>
          <div>
            <span>// LIVE CLIENT WORK</span>
            <h2 id={`${number}-cta`}>Visit the finished website.</h2>
          </div>
          <div className="case-study__actions">
            <a className="button button--light" href={liveUrl} target="_blank" rel="noreferrer">
              View live site <ExternalLink size={15} />
            </a>
            <Link className="button button--dark" href="/#contact">
              Let&apos;s work together <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
        <ProjectNavigation currentHref={currentHref} />
      </main>
      <Footer />
    </>
  );
}
