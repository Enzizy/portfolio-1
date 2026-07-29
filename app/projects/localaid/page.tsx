import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, ExternalLink } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";
import { createProjectMetadata } from "@/lib/metadata";

const features = [
  "Create categorized requests for emergency, agriculture, household, and general needs",
  "Set request urgency, duration, barangay, and specific location",
  "Browse, search, and filter open requests by category, urgency, and location",
  "Verified-user checks before posting requests or contacting helpers",
  "One-to-one conversations connected to individual help requests",
  "Chat messages with image attachments and live location sharing",
  "Request fulfillment workflow with automatic chat archiving",
  "Helper ratings and written feedback after fulfilled requests",
  "Category-weighted help points and community leaderboard",
  "Profile management with photos, location, and verification status",
  "In-app and Firebase Cloud Messaging notifications",
  "Emergency broadcasts for urgent community requests",
] as const;

const stack = [
  { label: "Mobile", value: "Kotlin, Android SDK, XML layouts, and View Binding" },
  { label: "Architecture", value: "Android ViewModel, LiveData, RecyclerView, and Navigation" },
  { label: "Backend", value: "Firebase Authentication, Cloud Firestore, and Cloud Storage" },
  { label: "Notifications", value: "Firebase Cloud Messaging and Node.js Cloud Functions" },
  { label: "Location", value: "Google Maps SDK and fused location services" },
  { label: "Supporting tools", value: "Glide, Kotlin Coroutines, OkHttp, and EmailJS" },
] as const;

export const metadata = createProjectMetadata({
  title: "LocalAid — Crowdsourced Community Assistance App",
  description:
    "A native Android application that helps nearby residents request and offer assistance through location-aware posts, real-time chat, verification, and community rewards.",
  image: "/images/projects/localaid.png",
  imageAlt: "LocalAid community assistance mobile application",
});

export default function LocalAidPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell case-study" tabIndex={-1}>
        <header className="case-study__header">
          <Link className="case-study__back" href="/projects">
            <ArrowLeft size={14} /> All projects
          </Link>
          <p className="eyebrow">// CASE STUDY 02</p>
          <div className="case-study__title">
            <div>
              <span>CROWDSOURCED COMMUNITY ASSISTANCE</span>
              <h1>LocalAid</h1>
            </div>
            <p>
              A native Android platform connecting nearby residents who need help
              with community members ready to respond.
            </p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>Android application development</dd></div>
            <div><dt>Platform</dt><dd>Native Android application</dd></div>
            <div><dt>Core stack</dt><dd>Kotlin · Firebase · Google Maps</dd></div>
          </dl>
        </header>

        <figure className="case-study__hero case-study__hero--mobile">
          <Image
            src="/images/projects/localaid.png"
            alt="LocalAid home screen showing request help, offer help, and recent community posts"
            width={920}
            height={1920}
            sizes="(max-width: 767px) 76vw, 440px"
            priority
          />
        </figure>

        <section className="case-study__overview" aria-labelledby="localaid-overview">
          <div>
            <span>// 01</span>
            <h2 id="localaid-overview">Overview</h2>
          </div>
          <div>
            <p className="case-study__lead">
              LocalAid turns informal community support into a clear request,
              response, conversation, and fulfillment workflow.
            </p>
            <p>
              Residents can publish time-sensitive needs with categories, urgency,
              duration, and barangay-level location information. Other users can
              discover relevant requests, offer assistance, and coordinate directly
              through request-linked conversations.
            </p>
            <p>
              The experience builds trust through profile verification, ratings,
              help points, and a leaderboard while Firebase services keep requests,
              conversations, media, and notifications synchronized.
            </p>
          </div>
        </section>

        <section className="case-study__features" aria-labelledby="localaid-features">
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id="localaid-features">Key capabilities</h2>
            <p>Designed around discovery, trusted coordination, and accountable fulfillment.</p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__technology" aria-labelledby="localaid-technology">
          <div className="case-study__section-heading">
            <span>// 03</span>
            <h2 id="localaid-technology">Technology</h2>
            <p>A native Android client backed by Firebase data, storage, and messaging services.</p>
          </div>
          <dl>
            {stack.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby="localaid-cta">
          <div>
            <span>// SOURCE &amp; CONTACT</span>
            <h2 id="localaid-cta">Explore the build or start a conversation.</h2>
          </div>
          <div className="case-study__actions">
            <a
              className="button button--light"
              href="https://github.com/Enzizy/LocalAid"
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
        <ProjectNavigation currentHref="/projects/localaid" />
      </main>
      <Footer />
    </>
  );
}
