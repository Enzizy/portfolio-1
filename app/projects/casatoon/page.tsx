import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, ExternalLink } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CaseStudyStory } from "@/components/CaseStudyStory";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";
import { createProjectMetadata } from "@/lib/metadata";

const features = [
  "Three-step flow: write a story, pick a style, watch it become an animated video",
  "Five art styles: 2D cartoon, 3D animation, anime, claymation and realistic",
  "Try-it prompt on the home page that previews a scene from a typed idea",
  "Featured story gallery filtered by adventure, fantasy, friendship and education",
  "Free, Creator and Studio plans with monthly or yearly billing",
  "Free trials on paid plans, and watermark-free HD to 4K exports on higher tiers",
  "Separate product app for signed-in creators at app.casatoon.com",
  "Registration, login, session hydration and account billing views",
  "Hosted checkout with webhook-confirmed plan and credit activation",
  "Server-authoritative plan, amount, currency and user validation",
  "Hashed passwords, hashed session tokens, rate limiting and same-origin checks",
  "Automated tests for authentication, plan validation and billing activation",
] as const;

const stack = [
  { label: "Product site", value: "Responsive marketing site at casatoon.com, with story previews, styles, pricing and testimonials" },
  { label: "Frontend", value: "HTML, CSS, ES2022 JavaScript, responsive layouts and video media" },
  { label: "Backend", value: "Native Node.js HTTP server with modular authentication and billing services" },
  { label: "Storage", value: "SQLite with indexed users, sessions, billing accounts, payments and WAL mode" },
  { label: "Payments", value: "Hosted checkout and signed, idempotent webhook processing" },
  { label: "Security", value: "scrypt password hashing, SHA-256 session hashes, validation and rate limiting" },
] as const;

export const metadata = createProjectMetadata({
  path: "/projects/casatoon",
  title: "CasaToon — AI Story Studio",
  description:
    "CasaToon (formerly Roarly) turns a typed idea into a short animated video in one of five art styles, with accounts, free and paid plans, and webhook-confirmed billing.",
  image: "/images/projects/casatoon.webp",
  imageAlt: "CasaToon home page: Bring Your Stories to Life",
});

export default function CasaToonPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell case-study" tabIndex={-1}>
        <header className="case-study__header">
          <Link className="case-study__back" href="/projects">
            <ArrowLeft size={14} /> All projects
          </Link>
          <p className="eyebrow">// CASE STUDY 06</p>
          <div className="case-study__title">
            <div>
              <span>AI STORY STUDIO · FORMERLY ROARLY</span>
              <h1>CasaToon</h1>
            </div>
            <p>
              An AI story studio for everyone: type an idea, pick a style, and get a
              colourful animated video in minutes, not weeks.
            </p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>Full-stack product development</dd></div>
            <div><dt>Platform</dt><dd>Web product and marketing site</dd></div>
            <div><dt>Core stack</dt><dd>Node.js · SQLite · AI animation</dd></div>
          </dl>
        </header>

        <figure className="case-study__hero">
          <Image
            src="/images/projects/casatoon.webp"
            alt="CasaToon home page with the headline Bring Your Stories to Life, call-to-action buttons and a film-strip frame of an animated boy and lion"
            width={1423}
            height={764}
            sizes="(max-width: 948px) calc(100vw - 48px), 900px"
            priority
          />
        </figure>

        <CaseStudyStory id="casatoon-story" story={{
          challenge: "Making an animated story usually takes a studio and weeks of work. CasaToon had to make that feel as simple as typing a sentence, for storytellers, YouTubers, teachers, marketers and families alike.",
          decisions: "The product grew out of Roarly. I rebuilt the front door around one clear three-step flow and five visual styles, with a playful, kid-friendly identity. Billing authority stays on the server: plans and credits activate only after a signed payment webhook confirms the expected details.",
          result: "CasaToon now runs as a live product at casatoon.com, with a separate creator app, story gallery, and Free, Creator and Studio plans, taking visitors from an idea to an animated video.",
        }} />

        <section className="case-study__features" aria-labelledby="casatoon-features">
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id="casatoon-features">Key capabilities</h2>
            <p>From a typed idea to an animated video, and from a visitor to a paying creator.</p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__technology" aria-labelledby="casatoon-technology">
          <div className="case-study__section-heading">
            <span>// 03</span>
            <h2 id="casatoon-technology">Architecture</h2>
            <p>A product site and creator app on a Node backend, with webhook-first billing.</p>
          </div>
          <dl>
            {stack.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby="casatoon-cta">
          <div>
            <span>// SEE IT LIVE</span>
            <h2 id="casatoon-cta">Building a product that needs a polished path from idea to purchase?</h2>
          </div>
          <div className="case-study__actions">
            <a className="button button--light" href="https://casatoon.com" target="_blank" rel="noreferrer">
              Visit casatoon.com <ExternalLink size={15} />
            </a>
            <Link className="button button--dark" href="/#contact">
              Let&apos;s work together <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
        <ProjectNavigation currentHref="/projects/casatoon" />
      </main>
      <Footer />
    </>
  );
}
