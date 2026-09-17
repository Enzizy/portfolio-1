import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Clapperboard, Clock3, Play, Star, Tv } from "lucide-react";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { getDetails, getRecommendations, getSeason, isMediaType, mediaTypeLabel, tmdbImage, type MediaType, type TmdbDetails, type TmdbEpisode, vidsrcEmbedUrl } from "@/lib/tmdb";
import { TitleCard } from "../../TitleCard";
import "../../movies.css";

type Props = {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ s?: string | string[]; e?: string | string[] }>;
};

function parseId(value: string) {
  return /^\d{1,10}$/.test(value) && Number(value) > 0 ? Number(value) : null;
}

function parseIndex(value: string | string[] | undefined, fallback: number) {
  const raw = typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
  const number = Number(raw);
  return Number.isSafeInteger(number) && number > 0 && number < 10_000 ? number : fallback;
}

async function loadTitle(type: string, id: string): Promise<{ type: MediaType; title: TmdbDetails | null } | null> {
  const parsedId = parseId(id);
  if (!isMediaType(type) || !parsedId) return null;
  return { type, title: await getDetails(type, parsedId) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, id } = await params;
  try {
    const loaded = await loadTitle(type, id);
    if (loaded?.title) {
      return {
        title: `${loaded.title.title} — Screen Room`,
        description: loaded.title.overview.slice(0, 155) || `Watch ${loaded.title.title} in the Screen Room.`,
        robots: { index: false, follow: false },
      };
    }
  } catch { /* The page renders its own error state. */ }
  return { title: "Title — Screen Room", robots: { index: false, follow: false } };
}

function watchHref(type: MediaType, id: number, season: number, episode: number) {
  return `/movies/${type}/${id}?s=${season}&e=${episode}#player`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main id="main-content" className="movies-page" tabIndex={-1}>
        <div className="movies-shell">
          <div className="movies-topline"><span>ZB. / THE SCREEN ROOM</span><span>FILMS + SERIES / PERSONAL</span></div>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default async function TitlePage({ params, searchParams }: Props) {
  const { type, id } = await params;
  const query = await searchParams;

  let loaded: Awaited<ReturnType<typeof loadTitle>>;
  try {
    loaded = await loadTitle(type, id);
  } catch {
    return <Shell><div className="movies-unavailable"><Clapperboard size={35} aria-hidden="true" /><h1>Title details are unavailable.</h1><p>Please try again in a moment.</p><Link className="movies-primary-link" href="/movies"><ArrowLeft size={17} /> Back to the catalog</Link></div></Shell>;
  }
  if (!loaded || !loaded.title) notFound();

  const { title } = loaded;
  const mediaType = loaded.type;
  const isTv = mediaType === "tv";

  // Season/episode selection for TV; movies ignore both.
  const seasonNumbers = title.seasons.map((season) => season.season_number);
  const season = isTv ? (seasonNumbers.includes(parseIndex(query.s, seasonNumbers[0] ?? 1)) ? parseIndex(query.s, seasonNumbers[0] ?? 1) : seasonNumbers[0] ?? 1) : 1;
  let episodes: TmdbEpisode[] = [];
  if (isTv) {
    try { episodes = await getSeason(title.id, season); } catch { episodes = []; }
  }
  const episodeNumbers = episodes.map((episode) => episode.episode_number);
  const episode = isTv ? (episodeNumbers.includes(parseIndex(query.e, 1)) ? parseIndex(query.e, 1) : episodeNumbers[0] ?? 1) : 1;
  const currentEpisode = episodes.find((item) => item.episode_number === episode);

  const embedUrl = vidsrcEmbedUrl(mediaType, title.id, season, episode);
  const recommendations = await getRecommendations(mediaType, title.id);
  const backdrop = tmdbImage(title.backdrop_path, "w1280");
  const poster = tmdbImage(title.poster_path, "w500");
  const synopsis = title.overview.trim() || "A synopsis is not available for this title yet.";

  // Neighbouring episodes for prev/next controls.
  const episodeIndex = episodeNumbers.indexOf(episode);
  const previousEpisode = episodeIndex > 0 ? episodeNumbers[episodeIndex - 1] : null;
  const nextEpisode = episodeIndex >= 0 && episodeIndex < episodeNumbers.length - 1 ? episodeNumbers[episodeIndex + 1] : null;

  return (
    <Shell>
      <Link className="movies-back" href="/movies"><ArrowLeft size={16} aria-hidden="true" /> Back to the catalog</Link>

      <header className="movies-detail-hero">
        {backdrop && <Image className="movies-detail-hero__backdrop" src={backdrop} alt="" fill priority sizes="100vw" />}
        <div className="movies-detail-hero__index"><span>SCREEN ROOM / {mediaTypeLabel(mediaType).toUpperCase()} {title.id}</span><Clapperboard size={27} aria-hidden="true" /></div>
        <div className="movies-detail-hero__body">
          {poster && <Image className="movies-detail-hero__poster" src={poster} alt={`${title.title} poster`} width={500} height={750} sizes="(max-width: 700px) 120px, 200px" />}
          <div className="movies-detail-hero__copy">
            <span className="movies-kicker">{mediaTypeLabel(mediaType).toUpperCase()} / {title.year ?? "YEAR TBA"}</span>
            <h1>{title.title}</h1>
            {title.tagline && <em className="movies-detail-hero__tagline">{title.tagline}</em>}
            <p>{synopsis}</p>
            <div className="movies-detail-hero__tags">
              {title.genres.slice(0, 4).map((genre) => <span key={genre}>{genre}</span>)}
              {title.vote_average > 0 && <span><Star size={13} fill="currentColor" aria-hidden="true" /> {title.vote_average.toFixed(1)} / 10</span>}
            </div>
            <a className="movies-primary-link movies-detail-hero__play" href="#player"><Play size={16} fill="currentColor" aria-hidden="true" /> {isTv ? `Play S${season} E${episode}` : "Play movie"}</a>
          </div>
        </div>
        <span className="movies-detail-hero__number" aria-hidden="true">{String(title.id).slice(-3)}</span>
      </header>

      <section className="movies-facts" aria-label="Title information">
        <div><span>RELEASED</span><strong>{title.release_date || title.year || "Not listed"}</strong></div>
        <div><span>{isTv ? "SEASONS" : "RUNTIME"}</span><strong>{isTv ? (title.number_of_seasons ? <><Tv size={16} aria-hidden="true" /> {title.number_of_seasons} seasons / {title.number_of_episodes ?? "?"} episodes</> : "Not listed") : title.runtime ? <><Clock3 size={16} aria-hidden="true" /> {title.runtime} min</> : "Not listed"}</strong></div>
        <div><span>STATUS</span><strong>{title.status ?? "Not listed"}</strong></div>
        <div><span>RATING</span><strong>{title.vote_average > 0 ? `${title.vote_average.toFixed(1)} / 10 (${title.vote_count.toLocaleString()})` : "Not rated"}</strong></div>
      </section>

      <section id="player" className="movies-player" aria-labelledby="movies-player-title">
        <div className="movies-section-heading">
          <div><span className="movies-kicker">NOW PLAYING / 01</span><h2 id="movies-player-title">{isTv ? `S${season} E${episode}${currentEpisode ? ` · ${currentEpisode.name}` : ""}` : title.title}</h2></div>
          <p>{isTv && currentEpisode?.overview ? currentEpisode.overview : "If the stream stalls, use the server switcher inside the player or reload the page."}</p>
        </div>

        <div className="movies-player__frame">
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={isTv ? `${title.title} season ${season} episode ${episode}` : title.title}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              referrerPolicy="origin"
              loading="lazy"
            />
          </div>

        {isTv && (previousEpisode || nextEpisode) && <nav className="movies-pagination" aria-label="Episode navigation">
          {previousEpisode ? <Link href={watchHref(mediaType, title.id, season, previousEpisode)}><ArrowLeft size={16} /> Episode {previousEpisode}</Link> : <span />}
          <span>EPISODE {episode} / {episodeNumbers.length}</span>
          {nextEpisode && <Link href={watchHref(mediaType, title.id, season, nextEpisode)}>Episode {nextEpisode} <ArrowUpRight size={16} /></Link>}
        </nav>}
      </section>

      {isTv && title.seasons.length > 0 && (
        <section className="movies-episodes" aria-labelledby="movies-episodes-title">
          <div className="movies-section-heading">
            <div><span className="movies-kicker">EPISODES / 02</span><h2 id="movies-episodes-title">Pick an episode.</h2></div>
            <p>Choose a season, then an episode. The player above updates to match.</p>
          </div>

          <nav className="movies-seasons" aria-label="Seasons">
            {title.seasons.map((item) => <Link key={item.season_number} href={watchHref(mediaType, title.id, item.season_number, 1)} aria-current={item.season_number === season ? "page" : undefined}>{item.name || `Season ${item.season_number}`}<small>{item.episode_count} EP</small></Link>)}
          </nav>

          {episodes.length ? (
            <ol className="movies-episode-list">
              {episodes.map((item) => {
                const still = tmdbImage(item.still_path, "w342");
                const active = item.episode_number === episode;
                return (
                  <li key={item.id}>
                    <Link href={watchHref(mediaType, title.id, season, item.episode_number)} aria-current={active ? "page" : undefined}>
                      <span className="movies-episode__still">{still ? <Image src={still} alt="" width={342} height={192} sizes="(max-width: 700px) 120px, 180px" /> : <Tv size={22} aria-hidden="true" />}<Play size={18} fill="currentColor" aria-hidden="true" /></span>
                      <span className="movies-episode__copy">
                        <small>EPISODE {item.episode_number}{item.runtime ? ` / ${item.runtime} MIN` : ""}{item.air_date ? ` / ${item.air_date}` : ""}</small>
                        <strong>{item.name || `Episode ${item.episode_number}`}</strong>
                        {item.overview && <p>{item.overview}</p>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : <div className="movies-empty"><Tv size={28} aria-hidden="true" /><h3>No episode list.</h3><p>TMDB has no episode details for this season yet.</p></div>}
        </section>
      )}

      {title.cast.length > 0 && <section className="movies-cast" aria-label="Cast"><span className="movies-kicker">STARRING</span><p>{title.cast.join(" · ")}</p></section>}

      {recommendations.length > 0 && (
        <section className="movies-recommendations" aria-labelledby="movies-recs-title">
          <div className="movies-section-heading"><div><span className="movies-kicker">MORE LIKE THIS</span><h2 id="movies-recs-title">Keep the night going.</h2></div></div>
          <div className="movies-grid">{recommendations.map((item) => <TitleCard key={item.id} title={item} />)}</div>
        </section>
      )}

      <div className="movies-credit"><span><Clapperboard size={17} aria-hidden="true" /> SCREEN ROOM</span><p>Title data and artwork from <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB <ArrowUpRight size={13} /></a>. Playback is embedded from VidSrc; this site does not host any video.</p></div>
    </Shell>
  );
}
