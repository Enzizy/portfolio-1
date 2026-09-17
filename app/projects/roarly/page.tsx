import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, ExternalLink } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CaseStudyStory } from "@/components/CaseStudyStory";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";
import { createProjectMetadata } from "@/lib/metadata";

const features = [
  "Responsive landing, pricing, account, payment-success, and legal-policy pages",
  "Watercolor-inspired product storytelling and animation-style galleries",
  "Local sample-video playback with modal, backdrop, and keyboard controls",
  "Registration, login, session hydration, and account billing views",
  "Fixed plans plus validated custom credit tiers for Pro Plus",
  "PayMongo hosted checkout with card, GCash, Maya, and QR Ph options",
  "Webhook-confirmed subscription and credit activation",
  "Server-authoritative plan, amount, currency, and user validation",
  "Idempotent payment handling and account credit updates",
  "Hashed passwords, hashed session tokens, rate limiting, and same-origin checks",
  "Static-preview fallbacks while protecting backend-only checkout behavior",
  "Automated tests for authentication, plan validation, and billing activation",
] as const;

const stack = [
  { label: "Frontend", value: "HTML, CSS, ES2022 JavaScript, responsive layouts, and local video media" },
  { label: "Backend", value: "Native Node.js HTTP server with modular authentication and billing services" },
  { label: "Storage", value: "SQLite with indexed users, sessions, billing accounts, payments, and WAL mode" },
  { label: "Payments", value: "PayMongo hosted checkout and signed, idempotent webhook processing" },
  { label: "Security", value: "scrypt password hashing, SHA-256 session hashes, validation, and rate limiting" },
  { label: "Delivery", value: "Docker, persistent storage, health checks, and static GitHub Pages previews" },
] as const;

export const metadata = createProjectMetadata({
  title: "Roarly — AI Animation Studio",
  description:
    "A standalone AI animation studio marketing site with account management, flexible pricing, PayMongo checkout, and webhook-confirmed billing access.",
  image: "/images/projects/roarly.png",
  imageAlt: "Roarly AI Animation Studio marketing experience",
});

export default function RoarlyPage() {
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
              <span>AI ANIMATION SAAS EXPERIENCE</span>
              <h1>Roarly</h1>
            </div>
            <p>
              A standalone marketing, account, and payment experience for an AI
              studio that turns stories and images into animated videos.
            </p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>Full-stack product development</dd></div>
            <div><dt>Platform</dt><dd>Responsive web application</dd></div>
            <div><dt>Core stack</dt><dd>Node.js · SQLite · PayMongo</dd></div>
          </dl>
        </header>

        <figure className="case-study__hero">
          <Image
            src="/images/projects/roarly.png"
            alt="Roarly AI Animation Studio landing page with watercolor artwork and animated story preview"
            width={1423}
            height={764}
            sizes="(max-width: 948px) calc(100vw - 48px), 900px"
            priority
          />
        </figure>

        <CaseStudyStory id="roarly-story" story={{
          challenge: "An AI animation product needs more than a visual landing page: visitors need to understand the creative possibilities, choose a plan, and trust what happens after payment.",
          decisions: "I paired story-led previews with account and pricing flows, then kept billing authority on the server. Credits activate only after a signed PayMongo webhook confirms the expected payment details.",
          result: "Roarly presents a coherent path from product discovery to checkout and account access, while its static preview can still explain the concept when the backend is unavailable.",
        }} />

        <section className="case-study__features" aria-labelledby="roarly-features">
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id="roarly-features">Key capabilities</h2>
            <p>A complete path from product discovery to verified paid access.</p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__technology" aria-labelledby="roarly-technology">
          <div className="case-study__section-heading">
            <span>// 03</span>
            <h2 id="roarly-technology">Architecture</h2>
            <p>A standalone Node-backed site with secure, webhook-first billing activation.</p>
          </div>
          <dl>
            {stack.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby="roarly-cta">
          <div>
            <span>// SOURCE &amp; CONTACT</span>
            <h2 id="roarly-cta">Building a product that needs a polished path to purchase?</h2>
          </div>
          <div className="case-study__actions">
            <a
              className="button button--light"
              href="https://github.com/Enzizy/Roarly"
              target="_blank"
              rel="noreferrer"
            >
              View repository <ExternalLink size={15} />
            </a>
            <Link className="button button--dark" href="/#contact">
              Let&apos;s work together <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
        <ProjectNavigation currentHref="/projects/roarly" />
      </main>
      <Footer />
    </>
  );
}
