import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CaseStudyStory } from "@/components/CaseStudyStory";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";
import { createProjectMetadata } from "@/lib/metadata";

const features = [
  "Search and browse YouTube Music: songs, albums, artists, playlists and the home feed",
  "Sign in with Google for your library, liked songs, playlists and history",
  "Gapless playback through libmpv, with loudness normalization and crossfade",
  "Synced lyrics with auto-scroll and click-to-jump",
  "A queue with radio and autoplay, drag to reorder, restored after a restart",
  "Tempo, pitch and reverb, with presets like slowed + reverb and nightcore",
  "Eight themes, light and dark, custom accent colors and fonts",
  "Your own background image behind the whole app, with dim and blur",
  "An Android app with background playback and lock-screen controls",
  "Plays through the Enzi notch on Windows, album art included",
  "Mini player, theater mode and global media hotkeys on the desktop",
  "Signed auto-updates on Windows and an update check on Android",
] as const;

const stack = [
  { label: "App shell", value: "Tauri 2 on WebView2 (Windows) and Android System WebView" },
  { label: "Backend", value: "Rust workspace: a YouTube Music (InnerTube) client, a libmpv player, SQLite via rusqlite" },
  { label: "Interface", value: "SvelteKit with Svelte 5 and Tailwind CSS 4, one codebase with a phone layout" },
  { label: "Android", value: "Kotlin Tauri plugins for the media session, playback service and Google sign-in, called over JNI" },
  { label: "Delivery", value: "GitHub Actions builds a signed Windows installer and a release-signed APK on every tag" },
] as const;

const gallery = [
  { file: "02-home-background.webp", alt: "Home with a custom background image showing through the sidebar and player bar" },
  { file: "03-appearance.webp", alt: "Appearance settings with eight themes, light and dark mode, and accent colors" },
  { file: "04-theme-tokyo-night.webp", alt: "The player in the Tokyo Night theme" },
  { file: "05-tempo-pitch-reverb.webp", alt: "Tempo, pitch and reverb dialog with presets" },
  { file: "06-light-mode.webp", alt: "The player and queue in light mode" },
] as const;

const phone = [
  { file: "07-android-home.webp", alt: "Enzi Music on Android: home with a custom background and the bottom navigation" },
  { file: "08-android-player.webp", alt: "Enzi Music on Android: the full-screen player with lyrics and queue buttons" },
] as const;

export const metadata = createProjectMetadata({
  path: "/projects/enzi-music",
  title: "Enzi Music — A YouTube Music Client for Windows and Android",
  description:
    "A YouTube Music client built with Rust, Tauri 2 and Svelte: gapless playback, synced lyrics, themes and custom backgrounds, on Windows and Android.",
  imageAlt: "Enzi Music's player with the queue open beside the album art",
});

export default function EnziMusicPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell case-study" tabIndex={-1}>
        <header className="case-study__header">
          <Link className="case-study__back" href="/projects">
            <ArrowLeft size={14} /> All projects
          </Link>
          <p className="eyebrow">// CASE STUDY 12</p>
          <div className="case-study__title">
            <div>
              <span>DESKTOP AND ANDROID MUSIC APP</span>
              <h1>Enzi Music</h1>
            </div>
            <p>
              A YouTube Music client for Windows and Android, and the music companion to Enzi:
              your library, lyrics and effects in a fast native app that you can make look your own.
            </p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>Fork, Android port and redesign</dd></div>
            <div><dt>Platform</dt><dd>Windows and Android</dd></div>
            <div><dt>Core stack</dt><dd>Rust · Tauri 2 · Svelte 5 · libmpv</dd></div>
          </dl>
        </header>

        <figure className="case-study__hero">
          <Image
            src="/images/projects/enzi-music/01-player.webp"
            alt="Enzi Music's player: album art, the song title and the queue beside it"
            width={1800}
            height={1125}
            sizes="(max-width: 948px) calc(100vw - 48px), 900px"
            priority
          />
        </figure>

        <CaseStudyStory id="enzi-music-story" story={{
          challenge: "I wanted my own YouTube Music app on both my PC and my phone, light enough to leave running, and wired into Enzi's notch on Windows.",
          decisions: "I built on LiMusic, an open-source Rust and Tauri client, and kept its playback engine and YouTube client. Then I ported it to Android with Kotlin plugins for background playback, lock-screen controls and Google sign-in, cut the features I didn't need, and gave it a monochrome look with a new logo and custom backgrounds.",
          result: "One codebase that ships a 52 MB Windows installer and a 46 MB Android app from the same tag, with signed updates and the Enzi notch showing what's playing.",
        }} />

        <section className="case-study__features" aria-labelledby="enzi-music-features">
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id="enzi-music-features">Key capabilities</h2>
            <p>The same library, lyrics and effects on the desktop and the phone.</p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__features" aria-labelledby="enzi-music-gallery">
          <div className="case-study__section-heading">
            <span>// 03</span>
            <h2 id="enzi-music-gallery">Make it yours</h2>
            <p>Themes, light and dark, and a background of your own.</p>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            {gallery.map(({ file, alt }) => (
              <Image key={file} src={`/images/projects/enzi-music/${file}`} alt={alt} width={1800} height={1125}
                sizes="(max-width: 948px) calc(100vw - 48px), 900px"
                style={{ width: "100%", height: "auto", borderRadius: 12 }} />
            ))}
          </div>
        </section>

        <section className="case-study__features" aria-labelledby="enzi-music-android">
          <div className="case-study__section-heading">
            <span>// 04</span>
            <h2 id="enzi-music-android">On Android</h2>
            <p>A phone layout from the same code, playing in the background with the screen off.</p>
          </div>
          {/* Phone screens are tall, so they sit side by side instead of stacking. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, maxWidth: 560 }}>
            {phone.map(({ file, alt }) => (
              <Image key={file} src={`/images/projects/enzi-music/${file}`} alt={alt} width={780} height={1688}
                sizes="(max-width: 640px) calc(50vw - 32px), 272px"
                style={{ width: "100%", height: "auto", borderRadius: 16 }} />
            ))}
          </div>
        </section>

        <section className="case-study__technology" aria-labelledby="enzi-music-technology">
          <div className="case-study__section-heading">
            <span>// 05</span>
            <h2 id="enzi-music-technology">Architecture</h2>
            <p>
              Built on <a href="https://github.com/SimoHypers/limusic" target="_blank" rel="noopener noreferrer">LiMusic</a> by
              SimoHypers, and open source under the same GPL-3.0 license.
            </p>
          </div>
          <dl>
            {stack.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby="enzi-music-cta">
          <div>
            <span>// OPEN SOURCE</span>
            <h2 id="enzi-music-cta">Get Enzi Music</h2>
          </div>
          <a className="button button--dark" href="https://github.com/Enzizy/Enzi-Music/releases/latest" target="_blank" rel="noopener noreferrer">
            Download <ArrowUpRight size={15} />
          </a>
        </section>
        <ProjectNavigation currentHref="/projects/enzi-music" />
      </main>
      <Footer />
    </>
  );
}
