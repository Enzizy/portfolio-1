import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowUpRight,
  Download,
  Facebook,
  Gamepad2,
  Github,
  Linkedin,
  Mail,
  MapPin,
} from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { ProjectVisual } from "@/components/ProjectVisual";
import { projects, services, stackGroups } from "@/data/portfolio";
import { getGitHubContributions, githubProfileUrl } from "@/lib/github";
import { AtlasViewport } from "./AtlasViewport";
import { displayFont, monoFont } from "./fonts";
import { connectors, stations, surveyMarks, WORLD, type StationId } from "./atlas";
import "./v3.css";

export const metadata: Metadata = {
  title: "Zhyronne Batican — Portfolio V3, an atlas",
  description: "The same portfolio, drawn as a map. Pan and zoom across projects, services, skills, and contact.",
  alternates: { canonical: "/v3" },
};

const socials = [
  { label: "GitHub", href: "https://github.com/Enzizy", icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zhyronne-batican-5458a53aa/", icon: Linkedin },
  { label: "Facebook", href: "https://www.facebook.com/Hakdog.Hakplas.Haler", icon: Facebook },
  { label: "Email", href: "mailto:zhyronnebatican@gmail.com", icon: Mail },
] as const;

const station = (id: StationId) => stations.find((item) => item.id === id)!;

/** [x, y, x, y, …] → the "x,y x,y" string an SVG polyline wants. */
function toPoints(flat: number[]) {
  const pairs: string[] = [];
  for (let i = 0; i < flat.length; i += 2) pairs.push(`${flat[i]},${flat[i + 1]}`);
  return pairs.join(" ");
}

function Plate({ id, title, lede, children, wide }: { id: StationId; title: string; lede?: string; children: ReactNode; wide?: boolean }) {
  const { code, x, y, w } = station(id);
  const style = { "--x": `${x}px`, "--y": `${y}px`, "--w": `${w}px` } as CSSProperties;

  return (
    <section
      id={`v3-${id}`}
      data-station={id}
      className={`v3-plate${wide ? " v3-plate--wide" : ""}`}
      style={style}
      aria-labelledby={`v3-${id}-title`}
    >
      <span className="v3-plate__ticks" aria-hidden="true"><i /><i /><i /><i /></span>
      <header className="v3-plate__head">
        <span className="v3-plate__code" aria-hidden="true">{code}</span>
        <h2 id={`v3-${id}-title`}>{title}</h2>
        <span className="v3-plate__coord" aria-hidden="true">{x} · {y}</span>
      </header>
      {lede && <p className="v3-plate__lede">{lede}</p>}
      <div className="v3-plate__body">{children}</div>
      <span className="v3-plate__ghost" aria-hidden="true">{code}</span>
    </section>
  );
}

async function CommitsPlate() {
  const data = await getGitHubContributions();
  const gridStyle: CSSProperties = { gridTemplateColumns: `repeat(${data.weekCount}, 9px)` };

  return (
    <Plate
      id="signal"
      title="Commits"
      lede={data.contributionCount === null ? "A year of public contribution activity." : `${data.contributionCount.toLocaleString()} public contributions in the last year.`}
    >
      {data.days.length ? (
        <div className="v3-calendar">
          <div className="v3-calendar__months" style={gridStyle} aria-hidden="true">
            {data.months.map((month) => <span key={`${month.label}-${month.week}`} style={{ gridColumn: month.week }}>{month.label}</span>)}
          </div>
          <div className="v3-calendar__days" style={gridStyle} aria-label="GitHub contribution activity for Enzizy">
            {data.days.map((day) => (
              <span className={`v3-cell v3-cell--${day.level}`} key={day.date} style={{ gridColumn: day.week, gridRow: day.weekday }} title={day.date} />
            ))}
          </div>
        </div>
      ) : (
        <p className="v3-note">GitHub activity is temporarily unavailable right now. The profile has the latest.</p>
      )}

      <div className="v3-calendar__foot">
        <span className="v3-legend" aria-label="Contribution intensity from less to more">
          Less {[0, 1, 2, 3, 4].map((level) => <i className={`v3-cell v3-cell--${level}`} key={level} />)} More
        </span>
        <a className="v3-link" href={githubProfileUrl} target="_blank" rel="noreferrer"><Github size={14} aria-hidden="true" /> github.com/Enzizy <ArrowUpRight size={12} aria-hidden="true" /></a>
      </div>
      <p className="v3-note">Public activity only — client and private repository work does not appear here.</p>
    </Plate>
  );
}

export default function PortfolioV3Page() {
  return (
    <AtlasViewport fontClass={`${displayFont.variable} ${monoFont.variable}`}>
      <svg className="v3-wires" viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} width={WORLD.w} height={WORLD.h} aria-hidden="true">
        {connectors.map((points, index) => (
          <polyline key={index} className="v3-wire" vectorEffect="non-scaling-stroke" points={toPoints(points)} />
        ))}
      </svg>

      {surveyMarks.map((mark) => (
        <span key={mark.label} className="v3-survey" style={{ "--x": `${mark.x}px`, "--y": `${mark.y}px` } as CSSProperties} aria-hidden="true">
          <i />{mark.label}
        </span>
      ))}

      {/* 00 — Origin */}
      <section id="v3-identity" data-station="identity" className="v3-plate v3-plate--origin" style={{ "--x": `${station("identity").x}px`, "--y": `${station("identity").y}px`, "--w": `${station("identity").w}px` } as CSSProperties} aria-labelledby="v3-identity-title">
        <span className="v3-plate__ticks" aria-hidden="true"><i /><i /><i /><i /></span>
        <div className="v3-origin">
          <div className="v3-origin__portrait">
            <Image src="/images/me.jpg" alt="Portrait of Zhyronne Batican" fill sizes="280px" priority />
            <span className="v3-origin__pin" aria-hidden="true" />
          </div>
          <div className="v3-origin__copy">
            <span className="v3-eyebrow">00 · You are here</span>
            <h1 id="v3-identity-title">Zhyronne<br />Batican</h1>
            <p className="v3-origin__roles">Full Stack Developer · AI Engineer · UI/UX Designer</p>
            <p className="v3-origin__blurb">I build custom web apps, WordPress sites, landing pages, mobile tools, and AI-assisted workflows.</p>
            <p className="v3-status"><i aria-hidden="true" />Available for freelance projects</p>
            <div className="v3-origin__actions">
              <a className="v3-button v3-button--solid" href="#v3-projects">See the work <ArrowUpRight size={15} aria-hidden="true" /></a>
              <a className="v3-button" href="#v3-contact">Start a project <ArrowUpRight size={15} aria-hidden="true" /></a>
            </div>
            <div className="v3-origin__socials">
              {socials.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} aria-label={label} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
                  <Icon size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <a className="v3-featured" href="/projects/ccr">
          <span className="v3-featured__shot"><Image src="/images/projects/ccr.webp" alt="" fill sizes="96px" /></span>
          <span><small>Featured build · CCR</small><strong>Orders, deliveries, and payments in one workflow</strong></span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <span className="v3-plate__ghost" aria-hidden="true">00</span>
      </section>

      {/* 01 — About */}
      <Plate id="about" title="About" lede="Freelance developer in the Philippines.">
        <p>I&apos;m a freelance full-stack developer building web apps, WordPress websites, landing pages, mobile tools, and AI-assisted experiences.</p>
        <p>From focused business pages to custom software and automation, I enjoy turning ideas into products that are simple, efficient, and useful.</p>
        <p>I continuously explore emerging technologies in artificial intelligence, automation, and interactive web experiences.</p>
        <p className="v3-place"><MapPin size={15} aria-hidden="true" /> Philippines · working with teams anywhere</p>
        <a className="v3-link" href="/resume.pdf" download><Download size={14} aria-hidden="true" /> Download resume</a>
      </Plate>

      {/* 02 — Services */}
      <Plate id="services" title="Services" lede="What I can build with you.">
        <ol className="v3-services">
          {services.map(({ icon: Icon, title, description }, index) => (
            <li key={title}>
              <span className="v3-services__mark"><Icon size={17} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="v3-services__index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <span>{description}</span>
            </li>
          ))}
        </ol>
      </Plate>

      {/* 03 — Projects */}
      <Plate id="projects" title="Projects" lede="Ten products built to be used, not just demoed." wide>
        <div className="v3-projects">
          {projects.map((project) => (
            <Link key={project.href} href={project.href} className="v3-project">
              <span className="v3-project__shot"><ProjectVisual variant={project.visual} /></span>
              <span className="v3-project__body">
                <small>{project.number} · {project.technologies.join(" · ")}</small>
                <strong>{project.title} <ArrowUpRight size={15} aria-hidden="true" /></strong>
                <span>{project.description}</span>
              </span>
            </Link>
          ))}
        </div>
        <Link className="v3-link" href="/projects">Every project in one list <ArrowUpRight size={12} aria-hidden="true" /></Link>
      </Plate>

      {/* 04 — Toolbox */}
      <Plate id="skills" title="Toolbox" lede="Chosen per product, not per habit.">
        <div className="v3-stacks">
          {stackGroups.map((group) => (
            <div className="v3-stack" key={group.title}>
              <h3>{group.title}</h3>
              <div>{group.items.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          ))}
        </div>
      </Plate>

      {/* 05 — Commits */}
      <CommitsPlate />

      {/* 06 — Contact */}
      <Plate id="contact" title="Signal out" lede="Tell me the problem, who it affects, and what a good result looks like.">
        <div className="v3-contact">
          <ContactForm />
          <div className="v3-contact__side">
            <a className="v3-contact__mail" href="mailto:zhyronnebatican@gmail.com">zhyronnebatican@gmail.com <ArrowUpRight size={15} aria-hidden="true" /></a>
            <ul className="v3-contact__links">
              {socials.filter(({ href }) => href.startsWith("http")).map(({ label, href, icon: Icon }) => (
                <li key={label}><a href={href} target="_blank" rel="noreferrer"><Icon size={15} aria-hidden="true" /> {label}</a></li>
              ))}
              <li><a href="/resume.pdf" download><Download size={15} aria-hidden="true" /> Resume</a></li>
            </ul>
            <p className="v3-note">Currently taking on selected freelance projects.</p>
          </div>
        </div>
      </Plate>

      {/* 07 — Detours */}
      <Plate id="detours" title="Detours" lede="The parts of this site that exist purely because they were fun.">
        <div className="v3-detours">
          <Link href="/arcade" className="v3-detour">
            <Gamepad2 size={26} aria-hidden="true" />
            <strong>Mini Arcade</strong>
            <span>Three quick games and one small cat.</span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <p className="v3-note">© {new Date().getFullYear()} Zhyronne Batican · <a className="v3-link v3-link--inline" href="#v3-identity">back to origin</a></p>
      </Plate>
    </AtlasViewport>
  );
}
