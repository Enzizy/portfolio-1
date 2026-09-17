import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clapperboard, Play, Search } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { getPopular, getTrending, mediaTypeLabel, searchTitles, tmdbImage, type MediaType, type TmdbTitle } from "@/lib/tmdb";
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

  let titles: TmdbTitle[] = [];
  let totalPages = 1;
  let totalResults = 0;
  let unavailable = false;
  try {
    const listing = query ? await searchTitles(query, type, page) : sort === "popular" ? await getPopular(type, page) : await getTrending(type, page);
    titles = listing.titles;
    totalPages = listing.total_pages;
    totalResults = listing.total_results;
  } catch {
    unavailable = true;
  }

  const lead = titles.find((title) => title.backdrop_path) ?? titles[0];
  const leadBackdrop = lead ? tmdbImage(lead.backdrop_path, "w1280") : null;

  return (
    <>
      <Navigation />
      <main id="main-content" className="movies-page" tabIndex={-1}>
        <div className="movies-shell">
          <div className="movies-topline"><span>ZB. / THE SCREEN ROOM</span><span>FILMS + SERIES / PERSONAL</span></div>

          <header className="movies-hero">
            <div className="movies-hero__copy">
              <span className="movies-kicker">A LITTLE OFF THE CLOCK / 001</span>
              <h1>What are we<br /><em>watching tonight?</em></h1>
              <p>Trending movies and series, ready to play. Search for something specific or scroll what everyone else is watching this week.</p>
              <a className="movies-primary-link" href="#discover">Explore the catalog <ArrowRight size={18} aria-hidden="true" /></a>
            </div>
            <Link className="movies-hero__feature" href={lead ? `/movies/${lead.media_type}/${lead.id}` : "#discover"} aria-label={lead ? `Watch ${lead.title}` : "Featured title"}>
              {leadBackdrop && <Image className="movies-hero__backdrop" src={leadBackdrop} alt="" fill priority sizes="(max-width: 700px) 100vw, 50vw" />}
              <span className="movies-hero__feature-label">{lead ? "TRENDING THIS WEEK" : "THE SCREEN ROOM"}</span>
              <span className="movies-hero__feature-number">01</span>
              <div>
                <small>{lead ? `${mediaTypeLabel(lead.media_type)} / ${lead.year ?? "YEAR TBA"}` : "MOVIES / TV SERIES"}</small>
                <strong>{lead?.title ?? "Find something worth watching."}</strong>
                {lead && <span className="movies-hero__feature-cta"><Play size={14} fill="currentColor" aria-hidden="true" /> Watch now</span>}
              </div>
            </Link>
          </header>

          <section id="discover" className="movies-discover" aria-labelledby="movies-discover-title">
            <div className="movies-section-heading">
              <div><span className="movies-kicker">THE CATALOG / 01</span><h2 id="movies-discover-title">Find your next watch.</h2></div>
              <p>Powered by TMDB. Pick movies or series, search a title, and press play.</p>
            </div>

            <div className="movies-toolbar">
              <nav className="movies-tabs" aria-label="Catalog category">
                <Link href={catalogHref("movie", query, 1, sort)} aria-current={type === "movie" ? "page" : undefined}>Movies</Link>
                <Link href={catalogHref("tv", query, 1, sort)} aria-current={type === "tv" ? "page" : undefined}>TV series</Link>
              </nav>
              {!query && <nav className="movies-tabs" aria-label="Sort order">
                <Link href={catalogHref(type, "", 1, "trending")} aria-current={sort === "trending" ? "page" : undefined}>Trending</Link>
                <Link href={catalogHref(type, "", 1, "popular")} aria-current={sort === "popular" ? "page" : undefined}>Popular</Link>
              </nav>}
            </div>

            <form className="movies-search" action="/movies" method="get" role="search">
              <input type="hidden" name="type" value={type} />
              <Search size={21} aria-hidden="true" />
              <label className="sr-only" htmlFor="movies-query">Search movies and TV series</label>
              <input id="movies-query" name="q" type="search" defaultValue={query} placeholder={type === "movie" ? "Search a movie title" : "Search a TV series"} maxLength={80} />
              <button type="submit">Search <ArrowRight size={16} aria-hidden="true" /></button>
            </form>

            <div className="movies-result-heading"><p>{query ? `Results for “${query}”` : `${sort === "popular" ? "Popular" : "Trending"} ${type === "movie" ? "movies" : "series"}`}</p><span>{(query ? totalResults : titles.length).toLocaleString()} TITLES</span></div>

            {unavailable ? <div className="movies-empty" role="status"><Clapperboard size={28} aria-hidden="true" /><h3>The catalog is unavailable.</h3><p>Check that TMDB_API_KEY is set, then try again in a moment.</p></div> : titles.length ? (
              <div className="movies-grid">{titles.map((title, index) => <TitleCard key={title.id} title={title} index={(page - 1) * 20 + index + 1} />)}</div>
            ) : <div className="movies-empty"><Search size={28} aria-hidden="true" /><h3>No titles found.</h3><p>Try another title or switch between movies and TV series.</p></div>}

            {!unavailable && totalPages > 1 && <nav className="movies-pagination" aria-label="Catalog pages">
              {page > 1 ? <Link href={catalogHref(type, query, page - 1, sort)}><ArrowLeft size={16} /> Previous</Link> : <span />}
              <span>PAGE {page} / {totalPages}</span>
              {page < totalPages && <Link href={catalogHref(type, query, page + 1, sort)}>Next <ArrowRight size={16} /></Link>}
            </nav>}
          </section>

          <div className="movies-credit"><span><Clapperboard size={17} aria-hidden="true" /> SCREEN ROOM</span><p>Title data and artwork from <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB <ArrowUpRight size={13} /></a>. This product uses the TMDB API but is not endorsed or certified by TMDB. Playback provided by VidSrc.</p></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
