import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CaseStudyStory } from "@/components/CaseStudyStory";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";
import { createProjectMetadata } from "@/lib/metadata";

const features = [
  "Floating chat in dark or light theme, using the business's own colour and logo",
  "Answers in English and Filipino, grounded only in the owner's FAQs and selected pages",
  "Search that understands word forms and synonyms, including \"magkano\" and \"presyo\"",
  "Answer buttons that open pages, restricted to pages the owner approved",
  "Full-screen chat on phones that adjusts to the on-screen keyboard",
  "Three-step WordPress setup with a checklist and a live preview of the chat",
  "FAQ editor and page picker, with pages re-indexed automatically when edited",
  "Agency dashboard to onboard clients, suspend service and set renewal dates",
  "Monthly, daily and per-minute limits with AI usage and cost estimates per client",
  "Single-use, 30-minute activation tokens tied to each site's address",
  "HMAC-signed requests with single-use nonces, so captured requests can't be replayed",
  "No stored conversation transcripts; visitor IPs kept only as rotating daily hashes",
] as const;

const stack = [
  { label: "WordPress plugin", value: "PHP 8.1+, WordPress REST API, vanilla JavaScript and CSS with no external scripts or fonts" },
  { label: "Agency service", value: "Node.js with no runtime dependencies, built-in SQLite and Node crypto" },
  { label: "AI", value: "Google Gemini, called only from the agency server" },
  { label: "Hosting", value: "Ubuntu VPS with systemd, Nginx, Let's Encrypt HTTPS and online database backups" },
  { label: "Testing", value: "Node test runner, PHP contract tests, real WordPress installs, Playwright and the official Plugin Check" },
] as const;

const gallery = [
  { file: "04-chat-filipino-question.webp", alt: "A visitor asks in Filipino and gets a Filipino answer with a Contact us button", width: 1600, height: 1000 },
  { file: "05-chat-light-theme-custom-colour.webp", alt: "The chat in its light theme with a different brand colour", width: 1600, height: 1000 },
  { file: "08-wp-settings-setup-status.webp", alt: "WordPress settings: setup guide with every check complete, usage and page index status", width: 1600, height: 1000 },
  { file: "13-agency-dashboard-clients.webp", alt: "Agency dashboard listing clients with status, monthly usage, renewal and AI cost", width: 1600, height: 1177 },
  { file: "15-agency-register-client-activation-token.webp", alt: "Registering a new client creates a single-use activation token", width: 1600, height: 1000 },
  { file: "14-agency-client-usage-and-limits.webp", alt: "One client's subscription, limits, credential and danger zone", width: 1600, height: 1450 },
] as const;

const phones = [
  { file: "07-mobile-chat-full-screen.webp", alt: "Full-screen chat on a phone", width: 1170, height: 2532 },
  { file: "17-agency-dashboard-mobile.webp", alt: "The agency dashboard on a phone", width: 780, height: 1688 },
] as const;

export const metadata = createProjectMetadata({
  path: "/projects/joyno-chatbot",
  title: "Joyno Chatbot — AI Customer Support for WordPress",
  description:
    "A WordPress plugin and subscription service that gives small businesses a branded AI assistant, answering visitors in English and Filipino from the business's own FAQs and pages.",
  image: "/images/projects/joyno-chatbot/03-chat-answer-with-page-button.webp",
  imageAlt: "Joyno Chatbot answering a visitor on a business website, with a View Services button",
});

export default function JoynoChatbotPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell case-study" tabIndex={-1}>
        <header className="case-study__header">
          <Link className="case-study__back" href="/projects">
            <ArrowLeft size={14} /> All projects
          </Link>
          <p className="eyebrow">// CASE STUDY 11</p>
          <div className="case-study__title">
            <div>
              <span>WORDPRESS PLUGIN + AI SERVICE</span>
              <h1>Joyno Chatbot</h1>
            </div>
            <p>
              A branded AI assistant that a business adds to its WordPress site. It answers visitors
              from the business&apos;s own FAQs and pages, and the agency runs it as a subscription.
            </p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>Full product: plugin, service, security and deployment</dd></div>
            <div><dt>Platform</dt><dd>WordPress plugin + Node.js service</dd></div>
            <div><dt>Core stack</dt><dd>PHP · Node.js · Google Gemini</dd></div>
          </dl>
        </header>

        <figure className="case-study__hero">
          <Image
            src="/images/projects/joyno-chatbot/03-chat-answer-with-page-button.webp"
            alt="Joyno Chatbot open on a business website, answering what services are offered with a View Services button"
            width={1600}
            height={1000}
            sizes="(max-width: 948px) calc(100vw - 48px), 900px"
            priority
          />
        </figure>

        <CaseStudyStory id="joyno-chatbot-story" story={{
          challenge: "Small businesses get the same questions every day, but can't staff live chat. Generic AI chatbots either invent answers or make the owner manage an AI account, API keys and billing.",
          decisions: "The plugin keeps a small search index of the pages the owner picks and sends only relevant excerpts, as a signed server-to-server request, to an agency service that checks the subscription and limits before asking Gemini. The API key never leaves the agency server.",
          result: "Businesses install a plugin and paste one activation code; the agency runs every client from one dashboard. It's live on a client site, passes the official WordPress Plugin Check with no errors or warnings, and has been submitted to WordPress.org.",
        }} />

        <section className="case-study__features" aria-labelledby="joyno-chatbot-features">
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id="joyno-chatbot-features">Key capabilities</h2>
            <p>One product with three audiences: visitors, business owners and the agency.</p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__features" aria-labelledby="joyno-chatbot-gallery">
          <div className="case-study__section-heading">
            <span>// 03</span>
            <h2 id="joyno-chatbot-gallery">On the site, in WordPress, and for the agency</h2>
            <p>Real plugin and dashboard code on a demo page, with scripted replies and demo client data.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {gallery.map(({ file, alt, width, height }) => (
              <Image key={file} src={`/images/projects/joyno-chatbot/${file}`} alt={alt} width={width} height={height}
                sizes="(max-width: 948px) calc(100vw - 48px), 450px"
                style={{ width: "100%", height: "auto", borderRadius: 12 }} />
            ))}
          </div>
          {/* Phone screenshots are tall, so they sit side by side at a fixed height. */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            {phones.map(({ file, alt, width, height }) => (
              <Image key={file} src={`/images/projects/joyno-chatbot/${file}`} alt={alt} width={width} height={height}
                sizes="240px"
                style={{ width: "auto", height: 480, maxWidth: "100%", borderRadius: 16 }} />
            ))}
          </div>
        </section>

        <section className="case-study__technology" aria-labelledby="joyno-chatbot-technology">
          <div className="case-study__section-heading">
            <span>// 04</span>
            <h2 id="joyno-chatbot-technology">Architecture</h2>
            <p>Credentials stay on the server; every request is signed, limited and leaves no transcript.</p>
          </div>
          <dl>
            {stack.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby="joyno-chatbot-cta">
          <div>
            <span>// AI FOR SMALL BUSINESSES</span>
            <h2 id="joyno-chatbot-cta">Want an AI assistant on your website?</h2>
          </div>
          <Link className="button button--dark" href="/#contact">
            Let&apos;s work together <ArrowUpRight size={15} />
          </Link>
        </section>
        <ProjectNavigation currentHref="/projects/joyno-chatbot" />
      </main>
      <Footer />
    </>
  );
}
