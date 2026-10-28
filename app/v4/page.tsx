import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import { ArrowDownRight, ArrowUpRight, Clapperboard, Download, Gamepad2, Github, Linkedin, Mail } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { PortfolioVersionSwitch } from "@/components/PortfolioVersionSwitch";
import { projects, services, stackGroups } from "@/data/portfolio";
import { getGitHubContributions } from "@/lib/github";
import { FluidCanvas } from "./_fluid/FluidCanvas";
import { Clock } from "./Clock";
import { Experience } from "./Experience";
import { displayFont, monoFont } from "./fonts";
import "lenis/dist/lenis.css";
import "./v4.css";

export const metadata: Metadata = {
  title: "Zhyronne Batican — Portfolio V4",
  description: "Full-stack developer, AI engineer and UI/UX designer. Web apps, websites and AI tools, built to feel alive.",
  alternates: { canonical: "/v4" },
};

const shots: Record<(typeof projects)[number]["visual"], { src: string; position?: string }> = {
  dashboard: { src: "/images/projects/hr.png", position: "left top" },
  localaid: { src: "/images/projects/localaid.png", position: "center 12%" },
  streetkings: { src: "/images/projects/street.png" },
  furniture: { src: "/images/projects/bw.png" },
  bookvoice: { src: "/images/projects/book.png" },
  casatoon: { src: "/images/projects/casatoon.webp" },
  ccr: { src: "/images/projects/ccr.png", position: "left top" },
  "lifedesk-crm": { src: "/images/projects/lifedesk-crm.png", position: "center top" },
  lifedesk: { src: "/images/projects/lifedesk-home.png", position: "center 10%" },
  "joyno-accounting": { src: "/images/projects/joyno-accounting.png", position: "left top" },
  enzi: { src: "/images/projects/enzi/01-hero.webp", position: "center top" },
};

const socials = [
  { label: "GitHub", href: "https://github.com/Enzizy", icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zhyronne-batican-5458a53aa/", icon: Linkedin },
  { label: "Email", href: "mailto:zhyronnebatican@gmail.com", icon: Mail },
] as const;

/** Each character in its own span, so the name can rise in letter by letter. */
function Chars({ text }: { text: string }) {
  return (
    <>
      {[...text].map((char, index) => (
        <span key={index} className="v4-char" aria-hidden="true">{char}</span>
      ))}
    </>
  );
}

/** Each word masked in its own slot, so headings can rise in word by word. */
function Words({ text, className = "v4-word" }: { text: string; className?: string }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <Fragment key={index}>
          {index > 0 && " "}
          <span className={className}><span>{word}</span></span>
        </Fragment>
      ))}
    </>
  );
}

export default async function PortfolioV4Page() {
  const contributions = await getGitHubContributions();
  const tools = stackGroups.flatMap((group) => group.items);
  const half = Math.ceil(tools.length / 2);

  return (
    <div className={`v4-root ${displayFont.variable} ${monoFont.variable}`} data-theme="dark">
      <noscript>
        <style>{".v4-loader{display:none!important}"}</style>
      </noscript>
      <div className="v4-loader" aria-hidden="true">
        <div className="v4-loader__top">
          <span>Zhyronne Batican</span>
          <span>Portfolio — 2026</span>
        </div>
        <div className="v4-loader__count"><span>000</span></div>
        <div className="v4-loader__bar"><i /></div>
      </div>

      <header className="v4-nav">
        <Link href="/" className="v4-nav__mark" aria-label="Zhyronne Batican, version 1">ZB<span>.</span></Link>
        <nav className="v4-nav__links" aria-label="Sections">
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="v4-nav__end">
          <Clock />
          <PortfolioVersionSwitch version={4} />
          <a className="v4-nav__cta" href="#contact">Let&apos;s talk</a>
        </div>
      </header>

      <Experience />

      <main id="main-content" className="v4-main">
        {/* Hero: living ink under your cursor. */}
        <section className="v4-hero" data-theme="dark" aria-labelledby="v4-hero-title">
          <div className="v4-hero__frame">
            <FluidCanvas className="v4-hero__fluid" />
            <div className="v4-hero__content">
              <p className="v4-hero__kicker v4-fade">Full-stack developer · AI engineer · UI/UX designer</p>
              <h1 id="v4-hero-title" className="v4-hero__title" aria-label="Zhyronne Batican">
                <span className="v4-hero__line"><Chars text="Zhyronne" /></span>
                <span className="v4-hero__line v4-hero__line--indent"><Chars text="Batican" /></span>
              </h1>
              <div className="v4-hero__meta">
                <p className="v4-fade">
                  I design and build web apps, websites and AI tools that feel effortless, from the first pixel to the
                  last deploy. Based in the Philippines, working with teams anywhere.
                </p>
                <p className="v4-hero__hint v4-fade">Move your cursor to stir the ink</p>
              </div>
              <a className="v4-hero__scroll v4-fade" href="#about">
                <span>Scroll</span><i aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* Manifesto: the statement lights up as you read it. */}
        <section id="about" className="v4-manifesto" data-theme="light" aria-labelledby="v4-about-title">
          <p className="v4-label" data-reveal>(01) About</p>
          <h2 id="v4-about-title" className="v4-manifesto__statement">
            <Words
              className="v4-lit"
              text="I turn ideas into products people actually use: custom web apps, business websites, mobile tools and AI workflows that are simple, fast and genuinely useful."
            />
          </h2>
          <div className="v4-manifesto__grid">
            <figure className="v4-portrait">
              <div className="v4-portrait__mask">
                <Image src="/images/me.jpg" alt="Portrait of Zhyronne Batican" fill sizes="(max-width: 900px) 90vw, 40vw" />
              </div>
            </figure>
            <div className="v4-manifesto__copy">
              <p data-reveal>
                I&apos;m a freelance full-stack developer building web apps, WordPress sites, landing pages, mobile tools
                and AI-assisted experiences. From focused business pages to custom software and automation, I enjoy
                turning rough ideas into products that are clear and reliable.
              </p>
              <dl className="v4-stats">
                <div data-reveal><dt>Projects shipped</dt><dd data-count={projects.length}>{projects.length}</dd></div>
                <div data-reveal><dt>Tools in rotation</dt><dd data-count={tools.length}>{tools.length}</dd></div>
                {contributions.contributionCount !== null && (
                  <div data-reveal>
                    <dt>Public commits, last 12 months</dt>
                    <dd data-count={contributions.contributionCount}>{contributions.contributionCount}</dd>
                  </div>
                )}
              </dl>
              <a className="v4-link" href="/resume.pdf" download data-reveal>
                <Download size={15} aria-hidden="true" /> Download résumé
              </a>
            </div>
          </div>
        </section>

        {/* Work: a pinned reel that glides sideways as you scroll. */}
        <section id="work" className="v4-work" data-theme="dark" aria-labelledby="v4-work-title">
          <div className="v4-work__pin">
            <header className="v4-work__head">
              <p className="v4-label">(02) Selected work</p>
              <h2 id="v4-work-title" className="v4-heading"><Words text="Built to be used." /></h2>
              <p className="v4-work__count"><span>{String(projects.length).padStart(2, "0")}</span> projects · scroll</p>
            </header>
            <div className="v4-work__track">
              {projects.map((project) => {
                const shot = shots[project.visual];
                return (
                  <Link key={project.href} href={project.href} className="v4-card">
                    <span className="v4-card__media">
                      <Image
                        src={shot.src}
                        alt=""
                        fill
                        sizes="(max-width: 900px) 90vw, 46vw"
                        style={{ objectPosition: shot.position ?? "center" }}
                      />
                    </span>
                    <span className="v4-card__meta">
                      <span className="v4-card__index">{project.number}</span>
                      <span className="v4-card__title">{project.title}</span>
                      <span className="v4-card__tech">{project.technologies.join(" · ")}</span>
                      <ArrowUpRight className="v4-card__arrow" size={22} aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
              <Link href="/projects" className="v4-card v4-card--all">
                <span>Every project</span>
                <ArrowDownRight size={34} aria-hidden="true" />
              </Link>
            </div>
            <div className="v4-work__progress" aria-hidden="true"><i /></div>
          </div>
        </section>

        {/* Services: cards that stack as you scroll. */}
        <section id="services" className="v4-services" data-theme="light" aria-labelledby="v4-services-title">
          <p className="v4-label" data-reveal>(03) Services</p>
          <h2 id="v4-services-title" className="v4-heading"><Words text="What we can build together." /></h2>
          <ol className="v4-stack">
            {services.map(({ icon: Icon, title, description }, index) => (
              <li key={title} className="v4-stack__card" style={{ "--i": index } as CSSProperties}>
                <span className="v4-stack__index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <Icon className="v4-stack__icon" size={56} strokeWidth={1.2} aria-hidden="true" />
              </li>
            ))}
          </ol>
        </section>

        {/* Toolbox: two rows that speed up and lean with your scrolling. */}
        <section className="v4-marquee" data-theme="light" aria-label="Tools I use">
          {[tools.slice(0, half), tools.slice(half)].map((row, rowIndex) => (
            <div key={rowIndex} className="v4-marquee__row" data-direction={rowIndex === 0 ? 1 : -1}>
              <div className="v4-marquee__track">
                {[0, 1].map((copy) => (
                  <span key={copy} className="v4-marquee__set" aria-hidden={copy === 1 || undefined}>
                    {row.map((tool) => (
                      <span key={tool} className="v4-marquee__item">{tool}<i aria-hidden="true">✦</i></span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Contact: the page turns cobalt. */}
        <section id="contact" className="v4-contact" data-theme="blue" aria-labelledby="v4-contact-title">
          <p className="v4-label" data-reveal>(04) Contact</p>
          <h2 id="v4-contact-title" className="v4-contact__title"><Words text="Let's make something people remember." /></h2>
          <div className="v4-contact__grid">
            <div className="v4-contact__side">
              <a className="v4-magnet" href="mailto:zhyronnebatican@gmail.com" data-magnetic>
                <span className="v4-magnet__label">Start a project</span>
              </a>
              <a className="v4-contact__email" href="mailto:zhyronnebatican@gmail.com" data-reveal>zhyronnebatican@gmail.com</a>
              <ul className="v4-contact__socials" data-reveal>
                {socials.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
                      <Icon size={16} aria-hidden="true" /> {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="v4-contact__form" data-reveal>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="v4-footer" data-theme="dark">
        <div className="v4-footer__detours">
          <Link href="/movies" className="v4-detour"><Clapperboard size={20} aria-hidden="true" /> Screen Room</Link>
          <Link href="/arcade" className="v4-detour"><Gamepad2 size={20} aria-hidden="true" /> Mini Arcade</Link>
          <Link href="/projects" className="v4-detour"><ArrowUpRight size={20} aria-hidden="true" /> All projects</Link>
        </div>
        <p className="v4-footer__mark" aria-hidden="true">ZB.</p>
        <div className="v4-footer__line">
          <span>© {new Date().getFullYear()} Zhyronne Batican</span>
          <a href="#main-content" data-top>Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}
