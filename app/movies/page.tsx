import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clapperboard, Info, Play, Search, Star } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { getPopular, getTrending, searchTitles, tmdbImage, type MediaType, type TmdbTitle } from "@/lib/tmdb";
import { TitleCard } from "./TitleCard";
import "./movies.css";

export const metadata: Metadata = {
  title: "Screen Room — Zhyronne Batican",
  description: "A personal streaming room. Browse trending movies and TV series and press play.",
  alternates: { canonical: "/movies" },
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ q?: string | string[]; type?: string | string[]; page?: string | string[]; sort?: string | string[] }> };

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
}

function catalogHref(type: MediaType, query: string, page = 1, sort: "trending" | "popular" = "trending") {
  const params = new URLSearchParams();
  if (type === "tv") params.set("type", "tv");
  if (query) params.set("q", query);
  if (sort === "popular" && !query) params.set("sort", "popular");
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return `/movies${suffix ? `?${suffix}` : ""}`;
}

export default async function MoviesPage({ searchParams }: Props) {
  const params = await searchParams;
  const type: MediaType = first(params.type) === "tv" ? "tv" : "movie";
  const sort = first(params.sort) === "popular" ? "popular" : "trending";
  const query = first(params.q).trim().replace(/\s+/g, " ").slice(0, 80);
  const requestedPage = Number(first(params.page));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 500 ? requestedPage : 1;

  const primaryRequest = query ? searchTitles(query, type, page) : sort === "popular" ? getPopular(type, page) : getTrending(type, page);
  const secondaryRequest = query ? Promise.resolve(null) : sort === "popular" ? getTrending(type, 1) : getPopular(type, 1);
  const [primaryResult, secondaryResult] = await Promise.allSettled([primaryRequest, secondaryRequest]);
  const listing = primaryResult.status === "fulfilled" ? primaryResult.value : null;
  const titles: TmdbTitle[] = listing?.titles ?? [];
  const primaryIds = new Set(titles.map((title) => title.id));
  const otherTitles = secondaryResult.status === "fulfilled" ? (secondaryResult.value?.titles ?? []).filter((title) => !primaryIds.has(title.id)) : [];
  const totalPages = listing?.total_pages ?? 1;
  const totalResults = listing?.total_results ?? 0;
  const unavailable = primaryResult.status === "rejected";
  const lead = !query ? titles.find((title) => title.backdrop_path && title.poster_path) ?? titles[0] : null;
  const leadBackdrop = lead ? tmdbImage(lead.backdrop_path, "w1280") : null;
  const leadPoster = lead ? tmdbImage(lead.poster_path, "w500") : null;
  const typeLabel = type === "tv" ? "series" : "movies";
  const listLabel = query ? `Results for “${query}”` : `${sort === "popular" ? "Popular" : "Trending"} ${typeLabel}`;

  return (
    <>
      <Navigation />
      <main id="main-content" className="movies-page" tabIndex={-1}>
        <div className="movies-shell">
          <div className="movies-topline"><span><Clapperboard size={16} aria-hidden="true" /> Screen Room</span><span>Movies &amp; series</span></div>

          {!query && lead && <header className="movies-hero">
            {leadBackdrop && <Image className="movies-hero__backdrop" src={leadBackdrop} alt="" fill priority sizes="100vw" />}
            <div className="movies-hero__inner">
              <div className="movies-hero__copy">
                <span className="movies-kicker">{sort === "popular" ? "Popular now" : "Trending this week"}</span>
                <h1>{lead.title}</h1>
                <div className="movies-hero__facts">
                  {lead.vote_average > 0 && <span className="movies-hero__score"><Star size={13} fill="currentColor" aria-hidden="true" /> {lead.vote_average.toFixed(1)}</span>}
                  <span>{lead.year ?? "Coming soon"}</span>
                  <span>{type === "tv" ? "TV series" : "Movie"}</span>
                </div>
                {lead.overview && <p>{lead.overview}</p>}
                <div className="movies-hero__actions">
                  <Link className="movies-primary-link" href={`/movies/${lead.media_type}/${lead.id}#player`}><Play size={17} fill="currentColor" aria-hidden="true" /> Watch now</Link>
                  <Link className="movies-secondary-link" href={`/movies/${lead.media_type}/${lead.id}`}><Info size={17} aria-hidden="true" /> Details</Link>
                </div>
              </div>
              {leadPoster && <Link className="movies-hero__poster" href={`/movies/${lead.media_type}/${lead.id}`} aria-label={`Open ${lead.title}`}><Image src={leadPoster} alt="" width={500} height={750} sizes="260px" priority /></Link>}
            </div>
          </header>}

          <section id="discover" className="movies-discover" aria-labelledby="movies-discover-title">
            <div className="movies-toolbar">
              <nav className="movies-tabs" aria-label="Catalog category">
                <Link href={catalogHref("movie", query, 1, sort)} aria-current={type === "movie" ? "page" : undefined}>Movies</Link>
                <Link href={catalogHref("tv", query, 1, sort)} aria-current={type === "tv" ? "page" : undefined}>Series</Link>
              </nav>
              {!query && <nav className="movies-tabs" aria-label="Sort order">
                <Link href={catalogHref(type, "", 1, "trending")} aria-current={sort === "trending" ? "page" : undefined}>Trending</Link>
                <Link href={catalogHref(type, "", 1, "popular")} aria-current={sort === "popular" ? "page" : undefined}>Popular</Link>
              </nav>}
              <form className="movies-search" action="/movies" method="get" role="search">
                <input type="hidden" name="type" value={type} />
                <Search size={18} aria-hidden="true" />
                <label className="sr-only" htmlFor="movies-query">Search {type === "movie" ? "movies" : "TV series"}</label>
                <input id="movies-query" name="q" type="search" defaultValue={query} placeholder={type === "movie" ? "Search movies" : "Search series"} maxLength={80} />
                <button type="submit" aria-label="Search titles"><ArrowRight size={17} aria-hidden="true" /></button>
              </form>
            </div>

            <div className="movies-result-heading">
              {query ? <h1 id="movies-discover-title">{listLabel}</h1> : <h2 id="movies-discover-title">{listLabel}</h2>}
              <span>{(query ? totalResults : titles.length).toLocaleString()} titles</span>
            </div>

            {unavailable ? <div className="movies-empty" role="status"><Clapperboard size={28} aria-hidden="true" /><h3>The catalog is unavailable.</h3><p>Check that TMDB_API_KEY is set, then try again in a moment.</p></div> : titles.length ? (
              <div className="movies-grid">{titles.map((title, i) => <TitleCard key={title.id} title={title} index={query ? undefined : (page - 1) * 20 + i + 1} />)}</div>
            ) : <div className="movies-empty"><Search size={28} aria-hidden="true" /><h3>No titles found.</h3><p>Try another title or switch between movies and series.</p></div>}

            {!unavailable && totalPages > 1 && <nav className="movies-pagination" aria-label="Catalog pages">
              {page > 1 ? <Link href={catalogHref(type, query, page - 1, sort)}><ArrowLeft size={16} /> Previous</Link> : <span />}
              <span>Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={catalogHref(type, query, page + 1, sort)}>Next <ArrowRight size={16} /></Link>}
            </nav>}

            {!query && otherTitles.length > 0 && <section className="movies-extra" aria-labelledby="movies-extra-title">
              <div className="movies-result-heading"><h2 id="movies-extra-title">{sort === "popular" ? "Trending this week" : "Popular right now"}</h2><Link href={catalogHref(type, "", 1, sort === "popular" ? "trending" : "popular")}>See all <ArrowRight size={14} /></Link></div>
              <div className="movies-rail">{otherTitles.map((title) => <TitleCard key={title.id} title={title} sizes="(max-width: 700px) 38vw, 170px" />)}</div>
            </section>}
          </section>

          <div className="movies-credit"><span><Clapperboard size={15} aria-hidden="true" /> Screen Room</span><p>Title data and artwork from <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB <ArrowUpRight size={13} /></a>. This product uses the TMDB API but is not endorsed or certified by TMDB. Playback is embedded from VidSrc; stream quality depends on the available source.</p></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
