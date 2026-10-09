import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clapperboard,
  Download,
  Facebook,
  Gamepad2,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Sailboat,
  X,
} from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { ProjectVisual } from "@/components/ProjectVisual";
import { projects, services, stackGroups } from "@/data/portfolio";
import { getGitHubContributions, githubProfileUrl } from "@/lib/github";
import { Archipelago } from "./Archipelago";
import { displayFont, monoFont } from "./fonts";
import "./v4.css";

export const metadata: Metadata = {
  title: "Zhyronne Batican — Portfolio V4, an archipelago",
  description: "Sail a bangka between islands to explore the projects, services, stack, and contact details of full-stack developer Zhyronne Batican.",
  alternates: { canonical: "/v4" },
};

const socials = [
  { label: "GitHub", href: "https://github.com/Enzizy", icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zhyronne-batican-5458a53aa/", icon: Linkedin },
  { label: "Facebook", href: "https://www.facebook.com/Hakdog.Hakplas.Haler", icon: Facebook },
] as const;

/**
 * One island's card. At sea only the card for the island you are moored at shows;
 * in "read as a page" mode every card is laid out in order as a normal document.
 */
function Panel({ id, kicker, title, children, wide, primary }: { id: string; kicker: string; title: string; children: ReactNode; wide?: boolean; primary?: boolean }) {
  // The home card carries the page's one h1: it is the hero in page view.
  const Heading = primary ? "h1" : "h2";
  return (
    <section id={`v4-${id}`} className={`v4-panel${wide ? " v4-panel--wide" : ""}`} data-panel={id} aria-labelledby={`v4-${id}-title`}>
      <header className="v4-panel__head">
        <p className="v4-panel__kicker">{kicker}</p>
        <button type="button" className="v4-panel__close" data-panel-close aria-label="Close this card">
          <X size={16} aria-hidden="true" />
        </button>
      </header>
      <Heading id={`v4-${id}-title`} className="v4-panel__title">{title}</Heading>
      <div className="v4-panel__body">{children}</div>
    </section>
  );
}

function SailButton({ to, children, back }: { to: string; children: ReactNode; back?: boolean }) {
  return (
    <button type="button" className="v4-sail" data-sail={to}>
      {back && <ArrowLeft size={14} aria-hidden="true" />}
      {children}
      {!back && <ArrowRight size={14} aria-hidden="true" />}
    </button>
  );
}

export default async function PortfolioV4Page() {
  const contributions = await getGitHubContributions();
  const days = contributions.days.map(({ week, weekday, level }) => ({ week, weekday, level }));
  const calendarStyle = { gridTemplateColumns: `repeat(${contributions.weekCount}, 6px)` };

  return (
    <Archipelago
      className={`${displayFont.variable} ${monoFont.variable}`}
      fonts={{ display: displayFont.style.fontFamily, mono: monoFont.style.fontFamily }}
      days={days}
    >
      <Panel id="home" kicker="Home island · where every voyage starts" title="Zhyronne Batican" primary>
        <p className="v4-roles">Full-stack developer · AI engineer · UI/UX designer</p>
        <p>
          I build custom web apps, WordPress sites, landing pages, mobile tools, and AI-assisted workflows — from the
          Philippines, for teams anywhere. This portfolio is an archipelago: every island holds a part of my work.
        </p>
        <p className="v4-status"><i aria-hidden="true" /> Available for freelance projects</p>
        <div className="v4-actions">
          <SailButton to="project-0">Sail to my projects</SailButton>
          <SailButton to="contact">Start a project</SailButton>
        </div>
        <ul className="v4-socials">
          {socials.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer"><Icon size={15} aria-hidden="true" /> {label}</a>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel id="about" kicker="The bahay kubo · about me" title="About">
        <div className="v4-about">
          <div className="v4-about__photo">
            <Image src="/images/me.jpg" alt="Portrait of Zhyronne Batican" fill sizes="140px" />
          </div>
          <div className="v4-about__copy">
            <p>I&apos;m a freelance full-stack developer building web apps, WordPress websites, landing pages, mobile tools, and AI-assisted experiences.</p>
            <p>From focused business pages to custom software and automation, I enjoy turning ideas into products that are simple, efficient, and useful.</p>
          </div>
        </div>
        <p>I continuously explore emerging technologies in artificial intelligence, automation, and interactive web experiences.</p>
        <p className="v4-place"><MapPin size={15} aria-hidden="true" /> Philippines · working with teams anywhere</p>
        <a className="v4-link" href="/resume.pdf" download><Download size={15} aria-hidden="true" /> Download resume</a>
      </Panel>

      {projects.map((project, index) => (
        <Panel key={project.href} id={`project-${index}`} kicker={`Islet ${project.number} of ${String(projects.length).padStart(2, "0")} · projects`} title={project.title}>
          <div className="v4-shot"><ProjectVisual variant={project.visual} /></div>
          <ul className="v4-chips">{project.technologies.map((tech) => <li key={tech}>{tech}</li>)}</ul>
          <p>{project.description}</p>
          <Link className="v4-button" href={project.href}>
            Read the case study <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <div className="v4-actions v4-actions--split">
            {index > 0 ? <SailButton to={`project-${index - 1}`} back>Previous islet</SailButton> : <span />}
            {index < projects.length - 1 ? <SailButton to={`project-${index + 1}`}>Next islet</SailButton> : <SailButton to="services">On to Services</SailButton>}
          </div>
        </Panel>
      ))}

      <Panel id="services" kicker="The palengke · what I build" title="Services">
        <ul className="v4-services">
          {services.map(({ icon: Icon, title, description }) => (
            <li key={title}>
              <span className="v4-services__icon"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /></span>
              <strong>{title}</strong>
              <span>{description}</span>
            </li>
          ))}
        </ul>
        <div className="v4-actions"><SailButton to="contact">Talk about your project</SailButton></div>
      </Panel>

      <Panel id="stack" kicker="The lagoon · bump the crates" title="Toolbox">
        <p>Chosen per product, not per habit. Every crate floating in the lagoon is a tool in regular rotation.</p>
        <div className="v4-stack">
          {stackGroups.map((group) => (
            <div key={group.title}>
              <h3>{group.title}</h3>
              <ul className="v4-chips">{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </Panel>

      <Panel id="signal" kicker="The stilts · one post per day" title="A year of commits">
        <p>
          {contributions.contributionCount === null
            ? "Public GitHub activity from the last twelve months."
            : `${contributions.contributionCount.toLocaleString()} public contributions in the last year.`}{" "}
          Each stilt rising from the water is a day; the taller it stands, the busier the day.
        </p>
        {contributions.days.length > 0 && (
          <div className="v4-calendar" style={calendarStyle} role="img" aria-label="GitHub contribution calendar for Enzizy">
            {contributions.days.map((day) => (
              <span key={day.date} className={`v4-cell v4-cell--${day.level}`} style={{ gridColumn: day.week, gridRow: day.weekday }} title={day.date} />
            ))}
          </div>
        )}
        <p className="v4-note">Client and private repository work does not show up here.</p>
        <a className="v4-link" href={githubProfileUrl} target="_blank" rel="noreferrer">
          <Github size={15} aria-hidden="true" /> github.com/Enzizy <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </Panel>

      <Panel id="contact" kicker="The lighthouse · signal me" title="Let's build something" wide>
        <p>Tell me the problem, who it affects, and what a good result looks like. I&apos;ll reply with how I&apos;d approach it.</p>
        <a className="v4-mail" href="mailto:zhyronnebatican@gmail.com">
          <Mail size={16} aria-hidden="true" /> zhyronnebatican@gmail.com
        </a>
        <div className="v4-contact-form"><ContactForm /></div>
        <ul className="v4-socials">
          {socials.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer"><Icon size={15} aria-hidden="true" /> {label}</a>
            </li>
          ))}
          <li><a href="/resume.pdf" download><Download size={15} aria-hidden="true" /> Resume</a></li>
        </ul>
      </Panel>

      <Panel id="cinema" kicker="A detour · the outdoor cinema" title="Screen Room">
        <p>A TMDB-powered catalogue of films and shows, with a player attached. Built because it was fun.</p>
        <Link className="v4-button" href="/movies"><Clapperboard size={15} aria-hidden="true" /> Open the Screen Room</Link>
      </Panel>

      <Panel id="arcade" kicker="A detour · the arcade raft" title="Mini Arcade">
        <p>Three quick browser games and one small cat. Also built because it was fun.</p>
        <Link className="v4-button" href="/arcade"><Gamepad2 size={15} aria-hidden="true" /> Play the Mini Arcade</Link>
      </Panel>

      <footer className="v4-page-footer">
        <p><Sailboat size={15} aria-hidden="true" /> © {new Date().getFullYear()} Zhyronne Batican · sailed in three.js</p>
      </footer>
    </Archipelago>
  );
}
