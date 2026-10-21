import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { projects, services, stackGroups } from "@/data/portfolio";
import { getGitHubContributions, githubProfileUrl } from "@/lib/github";
import { Book } from "./Book";
import { monoFont, serifFont } from "./fonts";
import "./v5.css";

export const metadata: Metadata = {
  title: "Zhyronne Batican — Portfolio V5, a book",
  description: "An interactive portfolio you can leaf through: projects, services, stack, and contact for full-stack developer Zhyronne Batican.",
  alternates: { canonical: "/v5" },
};

/**
 * The book is drawn in WebGL; this text edition carries the same content as real
 * HTML. It is visually hidden behind the book (but read by screen readers and
 * search engines) and becomes the whole page in "Read as text" mode.
 */
export default async function PortfolioV5Page() {
  const contributions = await getGitHubContributions();
  const data = {
    days: contributions.days.map(({ week, weekday, level }) => ({ week, weekday, level })),
    weekCount: contributions.weekCount,
    contributionCount: contributions.contributionCount,
  };

  return (
    <Book
      className={`${serifFont.variable} ${monoFont.variable}`}
      fonts={{ serif: serifFont.style.fontFamily, sans: GeistSans.style.fontFamily, mono: monoFont.style.fontFamily }}
      data={data}
    >
      <article className="v5-text__inner">
        <header>
          <p className="v5-text__kicker">A portfolio in print</p>
          <h1>Zhyronne Batican</h1>
          <p className="v5-text__lede">
            Full-stack developer · AI engineer · UI/UX designer. Custom web apps, WordPress sites, landing pages, mobile
            tools and AI-assisted workflows — built in the Philippines for teams anywhere.
          </p>
        </header>

        <section aria-labelledby="v5-about">
          <p className="v5-text__kicker">01 — About</p>
          <h2 id="v5-about">I turn ideas into products people actually use.</h2>
          <p>I&apos;m a freelance full-stack developer building web apps, WordPress websites, landing pages, mobile tools, and AI-assisted experiences.</p>
          <p>From focused business pages to custom software and automation, I enjoy turning ideas into products that are simple, efficient, and useful.</p>
          <p>Philippines · remote-friendly · taking on freelance work. <a href="/resume.pdf" download>Download the résumé</a>.</p>
        </section>

        <section aria-labelledby="v5-services">
          <p className="v5-text__kicker">02 — Services</p>
          <h2 id="v5-services">What we can build together.</h2>
          <dl>
            {services.map((service) => (
              <div key={service.title}>
                <dt>{service.title}</dt>
                <dd>{service.description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="v5-stack">
          <p className="v5-text__kicker">03 — Toolbox</p>
          <h2 id="v5-stack">Chosen per product, not per habit.</h2>
          <dl>
            {stackGroups.map((group) => (
              <div key={group.title}>
                <dt>{group.title}</dt>
                <dd>{group.items.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="v5-work">
          <p className="v5-text__kicker">Selected work</p>
          <h2 id="v5-work">Ten projects</h2>
          <ol className="v5-text__projects">
            {projects.map((project) => (
              <li key={project.href}>
                <h3>{project.title}</h3>
                <p className="v5-text__meta">{project.technologies.join(" · ")}</p>
                <p>{project.description}</p>
                <Link href={project.href}>Open the case study →</Link>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="v5-signal">
          <p className="v5-text__kicker">04 — Signal</p>
          <h2 id="v5-signal">A year of commits.</h2>
          <p>
            {contributions.contributionCount === null
              ? "Public GitHub activity from the last twelve months."
              : `${contributions.contributionCount.toLocaleString()} public contributions in the last year.`}{" "}
            <a href={githubProfileUrl} target="_blank" rel="noreferrer">github.com/Enzizy</a>
          </p>
        </section>

        <section id="v5-contact" aria-labelledby="v5-contact-title">
          <p className="v5-text__kicker">05 — Contact</p>
          <h2 id="v5-contact-title">Let&apos;s build something that ships.</h2>
          <p>Tell me the problem, who it affects, and what a good result looks like.</p>
          <p><a href="mailto:zhyronnebatican@gmail.com">zhyronnebatican@gmail.com</a></p>
          <ul className="v5-text__links">
            <li><a href="https://github.com/Enzizy" target="_blank" rel="noreferrer">GitHub</a></li>
            <li><a href="https://www.linkedin.com/in/zhyronne-batican-5458a53aa/" target="_blank" rel="noreferrer">LinkedIn</a></li>
            <li><a href="https://www.facebook.com/Hakdog.Hakplas.Haler" target="_blank" rel="noreferrer">Facebook</a></li>
            <li><Link href="/movies">Screen Room</Link></li>
            <li><Link href="/arcade">Mini Arcade</Link></li>
          </ul>
        </section>
      </article>
    </Book>
  );
}
