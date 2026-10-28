import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CaseStudyStory } from "@/components/CaseStudyStory";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";
import { createProjectMetadata } from "@/lib/metadata";

const features = [
  "A slim notch at the top of the screen that opens on hover and gets out of the way",
  "Now playing from Spotify, browsers and any app using Windows media controls",
  "Synced lyrics from LRCLIB with an adjustable timing offset",
  "Pomodoro focus timer with breaks, a chime and a daily session count",
  "To-do list with an always-on-top floating widget",
  "Drag-and-drop file shelf with real image previews",
  "Drop an image to convert it to PNG, JPG or WebP",
  "Searchable clipboard history that skips password managers' private copies",
  "Quick actions: screenshot, mute mic, screen color picker, quiet mode, lock PC",
  "Popups for volume, Caps Lock, charger, network and Bluetooth battery",
  "Eight color palettes or custom colors, glow and corner roundness",
  "Signed auto-updates built by GitHub Actions",
] as const;

const stack = [
  { label: "App shell", value: "Tauri 2 (tao, wry) on the WebView2 built into Windows" },
  { label: "Backend", value: "Rust with the windows crate (Win32 and WinRT), image, webp, arboard, ureq" },
  { label: "Interface", value: "Vanilla JavaScript, CSS custom properties for theming, inline SVG icons" },
  { label: "Data", value: "Local JSON in %APPDATA%; weather from Open-Meteo, lyrics from LRCLIB" },
  { label: "Delivery", value: "2.4 MB NSIS installer, GitHub Actions releases, signed updates" },
] as const;

const gallery = [
  { file: "03-music.webp", alt: "Music tab with album art, controls, volume and synced lyrics" },
  { file: "04-focus-timer.webp", alt: "Focus timer with a progress ring and the current task" },
  { file: "06-file-shelf.webp", alt: "File shelf with image previews and file-type tiles" },
  { file: "09-clipboard-history.webp", alt: "Clipboard history with search and an image preview" },
  { file: "10-quick-actions.webp", alt: "Quick actions: screenshot, microphone, color picker, quiet mode and lock PC" },
  { file: "13-theme-sakura.webp", alt: "The to-do tab in the pink Sakura palette" },
] as const;

export const metadata = createProjectMetadata({
  path: "/projects/enzi",
  title: "Enzi — A Customizable Notch for Windows",
  description:
    "A Dynamic Island-style notch for Windows built with Rust and Tauri 2: music and synced lyrics, focus timer, to-do list, file shelf, clipboard history and quick actions.",
  image: "/images/projects/enzi/01-hero.webp",
  imageAlt: "Enzi notch open on the music player with the floating to-do widget",
});

export default function EnziPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell case-study" tabIndex={-1}>
        <header className="case-study__header">
          <Link className="case-study__back" href="/projects">
            <ArrowLeft size={14} /> All projects
          </Link>
          <p className="eyebrow">// CASE STUDY 10</p>
          <div className="case-study__title">
            <div>
              <span>WINDOWS DESKTOP UTILITY</span>
              <h1>Enzi</h1>
            </div>
            <p>
              A customizable notch for Windows, in the spirit of the Dynamic Island: a slim pill
              at the top of the screen that opens into music, focus, tasks, files and more.
            </p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>Design and development</dd></div>
            <div><dt>Platform</dt><dd>Windows 11 and 10</dd></div>
            <div><dt>Core stack</dt><dd>Rust · Tauri 2 · Win32/WinRT</dd></div>
          </dl>
        </header>

        <figure className="case-study__hero">
          <Image
            src="/images/projects/enzi/01-hero.webp"
            alt="Enzi on the desktop: the notch open on the music player, with the floating to-do widget"
            width={1800}
            height={1125}
            sizes="(max-width: 948px) calc(100vw - 48px), 900px"
            priority
          />
        </figure>

        <CaseStudyStory id="enzi-story" story={{
          challenge: "Windows has no glanceable place for what matters right now, like the playing song, a focus timer or the next meeting, without opening apps or covering what you're working on.",
          decisions: "A transparent, always-on-top Tauri window only captures the mouse over the visible notch, tucks away when a browser reaches the top, and hides in full screen. A small Rust backend talks to Windows media, clipboard, Bluetooth and drag-and-drop APIs.",
          result: "A 2.4 MB app with no runtime to install, every module switchable and re-themable, privacy-respecting clipboard history, and signed auto-updates.",
        }} />

        <section className="case-study__features" aria-labelledby="enzi-features">
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id="enzi-features">Key capabilities</h2>
            <p>Everything opens from one hover at the top of the screen.</p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__features" aria-labelledby="enzi-gallery">
          <div className="case-study__section-heading">
            <span>// 03</span>
            <h2 id="enzi-gallery">Inside the notch</h2>
          </div>
          {/* The notch panels are wide strips, so they stack full width. */}
          <div style={{ display: "grid", gap: 16 }}>
            {gallery.map(({ file, alt }) => (
              <Image key={file} src={`/images/projects/enzi/${file}`} alt={alt} width={1440} height={475}
                sizes="(max-width: 948px) calc(100vw - 48px), 900px"
                style={{ width: "100%", height: "auto", borderRadius: 12 }} />
            ))}
          </div>
        </section>

        <section className="case-study__technology" aria-labelledby="enzi-technology">
          <div className="case-study__section-heading">
            <span>// 04</span>
            <h2 id="enzi-technology">Architecture</h2>
            <p>About 2,300 lines of Rust and 3,600 of HTML, CSS and JavaScript.</p>
          </div>
          <dl>
            {stack.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby="enzi-cta">
          <div>
            <span>// OPEN SOURCE</span>
            <h2 id="enzi-cta">Try Enzi on your PC</h2>
          </div>
          <a className="button button--dark" href="https://github.com/Enzizy/Enzi/releases/latest" target="_blank" rel="noopener noreferrer">
            Download <ArrowUpRight size={15} />
          </a>
        </section>
        <ProjectNavigation currentHref="/projects/enzi" />
      </main>
      <Footer />
    </>
  );
}
