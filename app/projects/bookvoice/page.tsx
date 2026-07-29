import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";
import { createProjectMetadata } from "@/lib/metadata";

const features = [
  "Import PDF, TXT, Markdown, or pasted text",
  "Normalize text and detect editable chapter structures",
  "Generate narration locally with Piper or Kokoro",
  "Install the selected Python runtime, engine, and voice model only when needed",
  "Process chapters sequentially with progress, cancellation, and partial recovery",
  "Preview and save individual chapters or a combined MP3 audiobook",
  "Arrange narration, ambience, and effects across three timeline tracks",
  "Move, trim, split, fade, loop, and adjust clip volume",
  "Apply narration-aware ducking, resampling, and peak normalization",
  "Navigate with waveform previews, a draggable playhead, and timeline zoom",
  "Save reusable .bookvoice editor projects with undo and redo history",
  "Search Freesound with preview caching, license metadata, and attribution export",
] as const;

const stack = [
  { label: "Desktop", value: "Electron, Vite, ES2022 JavaScript, HTML, and CSS" },
  { label: "Processing", value: "Persistent local Python worker using JSON over stdin and stdout" },
  { label: "Speech", value: "Piper and Kokoro local text-to-speech engines" },
  { label: "Documents", value: "PDF.js plus TXT, Markdown, and pasted-text import" },
  { label: "Audio", value: "NumPy, SoundFile, waveform analysis, offline mixing, and MP3 export" },
  { label: "Distribution", value: "Electron Builder and a guided Windows NSIS installer" },
] as const;

export const metadata = createProjectMetadata({
  title: "BookVoice — Local-First Audiobook Studio",
  description:
    "A Windows desktop application that converts documents into locally generated audiobooks and provides a three-track editor for narration, ambience, and effects.",
  image: "/images/projects/book.png",
  imageAlt: "BookVoice local-first audiobook studio",
});

export default function BookVoicePage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell case-study" tabIndex={-1}>
        <header className="case-study__header">
          <Link className="case-study__back" href="/projects">
            <ArrowLeft size={14} /> All projects
          </Link>
          <p className="eyebrow">// CASE STUDY 05</p>
          <div className="case-study__title">
            <div>
              <span>LOCAL-FIRST AUDIOBOOK STUDIO</span>
              <h1>BookVoice</h1>
            </div>
            <p>
              A Windows desktop application for converting long-form documents into
              locally generated narration and shaping the result in a multitrack editor.
            </p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>Desktop application development</dd></div>
            <div><dt>Platform</dt><dd>Windows desktop application</dd></div>
            <div><dt>Core stack</dt><dd>Electron · Python · Local TTS</dd></div>
          </dl>
        </header>

        <figure className="case-study__hero">
          <Image
            src="/images/projects/book.png"
            alt="BookVoice desktop workspace for importing text, generating narration, and editing audio"
            width={1429}
            height={848}
            sizes="(max-width: 948px) calc(100vw - 48px), 900px"
            priority
          />
        </figure>

        <section className="case-study__overview" aria-labelledby="bookvoice-overview">
          <div>
            <span>// 01</span>
            <h2 id="bookvoice-overview">Overview</h2>
          </div>
          <div>
            <p className="case-study__lead">
              BookVoice combines document preparation, local speech synthesis, and
              audio arrangement in one privacy-conscious desktop workflow.
            </p>
            <p>
              I worked across the Electron interface, secure renderer-to-system bridge,
              persistent Python speech pipeline, first-run runtime provisioning,
              chapter-oriented generation, and three-track audio editor.
            </p>
            <p>
              Source documents and narration stay on the user&apos;s workstation. After
              initial engine and model downloads, the core workflow can run offline
              without accounts, a database, or a hosted backend.
            </p>
          </div>
        </section>

        <section className="case-study__features" aria-labelledby="bookvoice-features">
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id="bookvoice-features">Key capabilities</h2>
            <p>From raw documents to a structured, mixed, and exportable audiobook.</p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__technology" aria-labelledby="bookvoice-technology">
          <div className="case-study__section-heading">
            <span>// 03</span>
            <h2 id="bookvoice-technology">Architecture</h2>
            <p>A sandboxed Electron interface coordinating long-running local Python audio work.</p>
          </div>
          <dl>
            {stack.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby="bookvoice-cta">
          <div>
            <span>// DESKTOP PRODUCT DEVELOPMENT</span>
            <h2 id="bookvoice-cta">Have an ambitious local-first product in mind?</h2>
          </div>
          <Link className="button button--dark" href="/#contact">
            Let&apos;s work together <ArrowUpRight size={15} />
          </Link>
        </section>
        <ProjectNavigation currentHref="/projects/bookvoice" />
      </main>
      <Footer />
    </>
  );
}
