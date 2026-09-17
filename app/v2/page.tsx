import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Facebook,
  Folder,
  Github,
  Layers3,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { PortfolioVersionSwitch } from "@/components/PortfolioVersionSwitch";
import { ProjectVisual } from "@/components/ProjectVisual";
import { ThemeToggle } from "@/components/ThemeToggle";
import { projects, services, stackGroups } from "@/data/portfolio";
import { V2SectionNav } from "./V2SectionNav";
import "./v2.css";

export const metadata: Metadata = {
  title: "Zhyronne Batican — Portfolio V2",
  description: "Explore Zhyronne Batican's web apps, WordPress sites, landing pages, mobile tools, and AI-assisted work.",
  alternates: { canonical: "/v2" },
};

const socials = [
  { label: "GitHub", href: "https://github.com/Enzizy", icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zhyronne-batican-5458a53aa/", icon: Linkedin },
  { label: "Facebook", href: "https://www.facebook.com/Hakdog.Hakplas.Haler", icon: Facebook },
  { label: "Email", href: "mailto:zhyronnebatican@gmail.com", icon: Mail },
] as const;

const featuredTools = [
  { label: "HTML", logo: "html5" },
  { label: "CSS", logo: "css3" },
  { label: "JavaScript", logo: "javascript" },
  { label: "TypeScript", logo: "typescript" },
  { label: "React", logo: "react" },
  { label: "Vue", logo: "vuejs" },
  { label: "React Native", logo: "reactnative" },
  { label: "Flutter", logo: "flutter" },
  { label: "Tailwind CSS", logo: "tailwindcss" },
  { label: "Vite", logo: "vitejs" },
  { label: "Node.js", logo: "nodejs" },
  { label: "Python", logo: "python" },
  { label: "WordPress", logo: "wordpress" },
  { label: "PostgreSQL", logo: "postgresql" },
  { label: "Supabase", logo: "supabase" },
  { label: "Firebase", logo: "firebase" },
  { label: "GitHub", logo: "github" },
  { label: "AI workflows", logo: null },
] as const;

function V2Sidebar() {
  return (
    <aside className="v2-sidebar" aria-label="Portfolio navigation">
      <div className="v2-identity">
        <div className="v2-portrait">
          <Image src="/images/me.jpg" alt="Zhyronne Batican" fill sizes="180px" priority />
        </div>
        <h1>Zhyronne Batican</h1>
        <p>@enzizy · Full Stack Developer</p>
        <div className="v2-socials" aria-label="Social links">
          {socials.map(({ label, href, icon: Icon }) => (
            <a key={label} href={href} aria-label={label} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
              <Icon size={18} aria-hidden="true" />
            </a>
          ))}
          <ThemeToggle />
        </div>
        <PortfolioVersionSwitch version={2} />
      </div>

      <V2SectionNav placement="sidebar" />
    </aside>
  );
}

function V2MobileHeader() {
  return (
    <header className="v2-mobile-header">
      <a href="#home" className="v2-mobile-identity" aria-label="Back to Version 2 home">
        <span className="v2-mobile-portrait"><Image src="/images/me.jpg" alt="" fill sizes="48px" /></span>
        <span><strong>Zhyronne Batican</strong><small>Full Stack · AI · Design</small></span>
      </a>
      <div className="v2-mobile-actions"><PortfolioVersionSwitch version={2} /><ThemeToggle /></div>
    </header>
  );
}

function V2ToolBar() {
  return (
    <div className="v2-tool-bar" aria-label="Tools I work with">
      <div className="v2-tool-bar__label"><span>BUILT WITH</span><strong>My working stack</strong></div>
      <div className="v2-tool-bar__track" role="list">
        <div className="v2-tool-bar__marquee">
          {[false, true].map((duplicate) => (
            <div className="v2-tool-bar__set" key={String(duplicate)} aria-hidden={duplicate || undefined}>
              {featuredTools.map(({ label, logo }) => (
                <span className="v2-tool-bar__item" role={duplicate ? undefined : "listitem"} key={label}>
                  {logo ? <Image className={`v2-tool-bar__logo v2-tool-bar__logo--${logo}`} src={`/icons/stacks/${logo}.svg`} width={19} height={19} alt="" loading="eager" /> : <Sparkles size={19} strokeWidth={1.9} aria-hidden="true" />}{label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function V2Dashboard() {
  return (
    <section id="home" className="v2-dashboard" aria-labelledby="v2-headline">
      <div className="v2-intro">
        <div>
          <span className="v2-eyebrow">FULL STACK DEVELOPMENT · WORDPRESS · AI</span>
          <h2 id="v2-headline">Useful software.{" "}<br /><em>Thoughtfully built.</em></h2>
          <p>I build web apps, WordPress sites, landing pages, mobile tools, and AI-assisted workflows.</p>
        </div>
        <a className="v2-pill-button" href="#contact">Get in touch <ArrowUpRight size={17} /></a>
      </div>

      <div className="v2-mobile-stats" aria-label="Portfolio overview">
        <span><strong>{projects.length}</strong><small>PROJECTS</small></span>
        <span><strong>3</strong><small>FOCUS AREAS</small></span>
        <span><strong>PH</strong><small>BASED</small></span>
      </div>

      <div className="v2-mobile-featured">
        <div className="v2-mobile-section-head"><h3>Featured work</h3><a href="#projects">All projects <ArrowUpRight size={14} /></a></div>
        <a href="/projects/lifedesk-crm" className="v2-featured-link"><span className="v2-featured-link__image"><Image src="/images/projects/lifedesk-crm.png" alt="" fill sizes="90px" /></span><span><small>AI-ASSISTED PROSPECTING</small><strong>LifeDesk CRM</strong><em>Discover, review, and organize prospects.</em></span><ArrowUpRight size={17} /></a>
      </div>

      <V2ToolBar />

      <div className="v2-bento" aria-label="Portfolio overview cards">
        <a href="#projects" className="v2-card v2-card--projects">
          <span className="v2-card__heading"><span className="v2-card__icon"><Folder size={19} /></span><strong>Projects</strong><ArrowUpRight size={16} /></span>
          <p>Real products for real workflows, from internal operations to personal tools.</p>
          <span className="v2-project-previews" aria-hidden="true">
            <span><Image src="/images/projects/lifedesk-crm.png" alt="" fill sizes="190px" /></span>
            <span><Image src="/images/projects/ccr.png" alt="" fill sizes="190px" /></span>
          </span>
        </a>

        <a href="#about" className="v2-card v2-card--about">
          <span className="v2-card__heading"><span className="v2-card__icon"><UserRound size={19} /></span><strong>About</strong><ArrowUpRight size={16} /></span>
          <p>Developer, designer, and curious builder based in the Philippines.</p>
          <span className="v2-about-photo"><Image src="/images/me.jpg" alt="" fill sizes="180px" /></span>
        </a>

        <a href="#skills" className="v2-card v2-card--ai">
          <span className="v2-card__heading"><span className="v2-card__icon"><Sparkles size={19} /></span><strong>AI Builds</strong><ArrowUpRight size={16} /></span>
          <p>Assistance that fits the work, with people in control of important decisions.</p>
          <span className="v2-ai-chips"><span>AI-assisted apps</span><span>Local AI</span><span>Workflow helpers</span></span>
        </a>

        <a href="#skills" className="v2-card v2-card--stack">
          <span className="v2-card__heading"><span className="v2-card__icon"><Code2 size={19} /></span><strong>Toolbox</strong><ArrowUpRight size={16} /></span>
          <p>Modern tools, chosen to suit the product.</p>
          <span className="v2-stack-mark"><Code2 size={36} /><small>Web · Mobile · Data</small></span>
        </a>

        <a href="#services" className="v2-card v2-card--services">
          <span className="v2-card__heading"><span className="v2-card__icon"><Layers3 size={19} /></span><strong>Services</strong><ArrowUpRight size={16} /></span>
          <p>What I can build with you.</p>
          <span className="v2-service-list">
            {services.map(({ title, previewTitle }, index) => <span key={title}><i>{String(index + 1).padStart(2, "0")}</i>{previewTitle}</span>)}
          </span>
        </a>

        <a href="#contact" className="v2-card v2-card--contact">
          <span className="v2-card__heading"><span className="v2-card__icon"><Mail size={19} /></span><strong>Let&apos;s connect</strong><ArrowUpRight size={16} /></span>
          <p>Have a website, app, or AI workflow in mind? Tell me what you&apos;re trying to solve.</p>
          <span className="v2-contact-panel"><span className="v2-contact-orb"><MessageCircle size={29} /></span><span><strong>Available for selected projects</strong><small>Web · Mobile · AI</small></span><ArrowRight size={20} /></span>
        </a>
      </div>

      <div className="v2-mobile-explore">
        <div className="v2-mobile-section-head"><h3>Explore</h3><span>Swipe →</span></div>
        <div className="v2-explore-track">
          <a href="#projects" className="v2-explore-card v2-explore-card--projects">
            <span>01 PROJECTS</span>
            <Image src="/images/projects/lifedesk-crm.png" alt="" fill sizes="240px" />
            <strong>Products with a purpose</strong><small>See the systems I&apos;ve built.</small>
          </a>
          <a href="#services" className="v2-explore-card v2-explore-card--services">
            <span>02 SERVICES</span><Layers3 size={62} /><strong>What I can build</strong><small>Web, WordPress, mobile, AI, and design.</small>
          </a>
          <a href="#about" className="v2-explore-card v2-explore-card--about">
            <span>03 ABOUT</span><Image src="/images/me.jpg" alt="" fill sizes="240px" /><strong>Meet Zhyronne</strong><small>How I think and work.</small>
          </a>
          <a href="#contact" className="v2-explore-card v2-explore-card--contact">
            <span>04 CONTACT</span><Mail size={62} /><strong>Let&apos;s talk</strong><small>Tell me about your idea.</small>
          </a>
        </div>
      </div>
    </section>
  );
}

function V2Sections() {
  return (
    <div className="v2-sections">
      <section id="projects" className="v2-detail-section" aria-labelledby="v2-projects-title">
        <div className="v2-section-heading"><span>01 / SELECTED WORK</span><h2 id="v2-projects-title">Projects built to be used.</h2><p>Each one solves a specific problem, from business operations to personal organization.</p></div>
        <div className="v2-work-grid">
          {projects.map((project) => (
            <Link href={project.href} key={project.href} className="v2-work-card">
              <span className="v2-work-card__image"><ProjectVisual variant={project.visual} /></span>
              <span className="v2-work-card__body"><small>{project.number} / {project.technologies.slice(0, 2).join(" · ")}</small><strong>{project.title}</strong><span>{project.description}</span><ArrowUpRight size={18} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section id="services" className="v2-detail-section" aria-labelledby="v2-services-title">
        <div className="v2-section-heading"><span>02 / WHAT I DO</span><h2 id="v2-services-title">From idea to working product.</h2><p>Practical development and design shaped around the job your product needs to do.</p></div>
        <div className="v2-detail-grid">
          {services.map(({ icon: Icon, title, description }, index) => (
            <article className="v2-detail-card" key={title}><span className="v2-detail-card__top"><Icon size={23} /><small>{String(index + 1).padStart(2, "0")}</small></span><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
      </section>

      <section id="skills" className="v2-detail-section" aria-labelledby="v2-skills-title">
        <div className="v2-section-heading"><span>03 / TOOLBOX</span><h2 id="v2-skills-title">Tools behind the work.</h2><p>My stack spans interfaces, data, AI, and product design.</p></div>
        <div className="v2-skills-grid">
          {stackGroups.map((group) => <div className="v2-skill-group" key={group.title}><h3>{group.title}</h3><div>{group.items.map((item) => <span key={item}>{item}</span>)}</div></div>)}
        </div>
      </section>

      <section id="about" className="v2-detail-section v2-about-section" aria-labelledby="v2-about-title">
        <div className="v2-section-heading"><span>04 / ABOUT</span><h2 id="v2-about-title">Hi, I&apos;m Zhyronne.</h2><p>I&apos;m a full-stack developer, AI engineer, and UI/UX designer in the Philippines.</p></div>
        <div className="v2-about-detail"><div className="v2-about-detail__image"><Image src="/images/me.jpg" alt="Portrait of Zhyronne Batican" fill sizes="(max-width: 767px) 80vw, 300px" /></div><div><MapPin size={21} /><p>I build modern websites, useful software, and AI-assisted tools. I care about clear workflows, responsive interfaces, and products people can actually use.</p><p>My work ranges from internal business systems and prospecting tools to personal mobile apps and community platforms.</p><a href="/resume.pdf" download>Download resume <ArrowUpRight size={16} /></a></div></div>
      </section>

      <section id="contact" className="v2-detail-section v2-contact-section" aria-labelledby="v2-contact-title">
        <div className="v2-section-heading"><span>05 / CONTACT</span><h2 id="v2-contact-title">Let&apos;s make something useful.</h2><p>Share the problem, the people it affects, and what a good result would look like.</p></div>
        <div className="v2-contact-grid"><div><span className="v2-contact-icon"><Mail size={30} /></span><h3>Start a conversation.</h3><p>Available for selected freelance projects and thoughtful collaborations.</p><a href="mailto:zhyronnebatican@gmail.com">zhyronnebatican@gmail.com <ArrowUpRight size={17} /></a><div className="v2-contact-socials">{socials.filter(({ href }) => href.startsWith("http")).map(({ label, href, icon: Icon }) => <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer"><Icon size={18} /></a>)}</div></div><ContactForm /></div>
      </section>
      <footer className="v2-footer"><span>© {new Date().getFullYear()} Zhyronne Batican</span><a href="#home">Back to top ↑</a></footer>
    </div>
  );
}

export default function PortfolioV2Page() {
  return (
    <div className="v2-shell">
      <V2Sidebar />
      <V2MobileHeader />
      <main className="v2-main" id="main-content" tabIndex={-1}>
        <V2Dashboard />
        <V2Sections />
      </main>
      <V2SectionNav placement="mobile" />
    </div>
  );
}
