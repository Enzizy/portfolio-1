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
  const lead = !query ? titles.find((title) => title.backdrop_path) ?? titles[0] : null;
  const leadBackdrop = lead ? tmdbImage(lead.backdrop_path, "w1280") : null;

  return (
    <>
      <Navigation />
      <main id="main-content" className="movies-page" tabIndex={-1}>
        <div className="movies-shell">
          <div className="movies-topline"><span><Clapperboard size={17} aria-hidden="true" /> ZB. SCREEN ROOM</span><span>FIND YOUR NEXT WATCH</span></div>

          {!query && <header className="movies-hero">
            {leadBackdrop && <Image className="movies-hero__backdrop" src={leadBackdrop} alt="" fill priority sizes="100vw" />}
            <div className="movies-hero__copy">
              <span className="movies-kicker">FEATURED {type === "tv" ? "SERIES" : "MOVIE"} / {sort === "popular" ? "POPULAR NOW" : "TRENDING THIS WEEK"}</span>
              <h1>{lead?.title ?? "Your next watch starts here."}</h1>
              {lead && <div className="movies-hero__facts"><span>{lead.year ?? "COMING SOON"}</span><span>{type === "tv" ? "TV SERIES" : "MOVIE"}</span>{lead.vote_average > 0 && <span><Star size={15} fill="currentColor" aria-hidden="true" /> {lead.vote_average.toFixed(1)} / 10</span>}</div>}
              <p>{lead?.overview || "Explore movies and series, then settle in for something good."}</p>
              {lead && <div className="movies-hero__actions">
                <Link className="movies-primary-link" href={`/movies/${lead.media_type}/${lead.id}#player`}><Play size={19} fill="currentColor" aria-hidden="true" /> Watch now</Link>
                <Link className="movies-secondary-link" href={`/movies/${lead.media_type}/${lead.id}`}><Info size={19} aria-hidden="true" /> More details</Link>
              </div>}
            </div>
            <span className="movies-hero__credit">FEATURED FROM THE TMDB CATALOG</span>
          </header>}

          <section id="discover" className="movies-discover" aria-labelledby="movies-discover-title">
            <div className="movies-section-heading">
              <div><span className="movies-kicker">DISCOVER / 01</span>{query ? <h1 id="movies-discover-title">Search results</h1> : <h2 id="movies-discover-title">Explore the collection</h2>}</div>
              <p>Find a favorite or discover something new.</p>
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
            <form className="movies-search" action="/movies" method="get" role="search">
              <input type="hidden" name="type" value={type} />
              <Search size={21} aria-hidden="true" />
              <label className="sr-only" htmlFor="movies-query">Search {type === "movie" ? "movies" : "TV series"}</label>
              <input id="movies-query" name="q" type="search" defaultValue={query} placeholder={type === "movie" ? "Search movies" : "Search series"} maxLength={80} />
              <button type="submit" aria-label="Search titles"><ArrowRight size={19} aria-hidden="true" /></button>
            </form>
            </div>

            <div className="movies-result-heading"><p>{query ? `Results for “${query}”` : `${sort === "popular" ? "Popular" : "Trending"} ${type === "movie" ? "movies" : "series"}`}</p><span>{(query ? totalResults : titles.length).toLocaleString()} TITLES</span></div>

            {unavailable ? <div className="movies-empty" role="status"><Clapperboard size={28} aria-hidden="true" /><h3>The catalog is unavailable.</h3><p>Check that TMDB_API_KEY is set, then try again in a moment.</p></div> : titles.length ? (
              <div className={query ? "movies-grid" : "movies-rail"}>{titles.map((title) => <TitleCard key={title.id} title={title} layout={query ? "poster" : "landscape"} />)}</div>
            ) : <div className="movies-empty"><Search size={28} aria-hidden="true" /><h3>No titles found.</h3><p>Try another title or switch between movies and TV series.</p></div>}

            {!query && otherTitles.length > 0 && <section className="movies-extra" aria-label={sort === "popular" ? "Trending this week" : "Popular right now"}>
              <div className="movies-result-heading"><p>{sort === "popular" ? "Trending this week" : "Popular right now"}</p><span>MORE TO DISCOVER</span></div>
              <div className="movies-rail">{otherTitles.map((title) => <TitleCard key={title.id} title={title} layout="landscape" />)}</div>
            </section>}

            {!unavailable && totalPages > 1 && <nav className="movies-pagination" aria-label="Catalog pages">
              {page > 1 ? <Link href={catalogHref(type, query, page - 1, sort)}><ArrowLeft size={16} /> Previous</Link> : <span />}
              <span>PAGE {page} / {totalPages}</span>
              {page < totalPages && <Link href={catalogHref(type, query, page + 1, sort)}>Next <ArrowRight size={16} /></Link>}
            </nav>}
          </section>

          <div className="movies-credit"><span><Clapperboard size={17} aria-hidden="true" /> SCREEN ROOM</span><p>Title data and artwork from <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB <ArrowUpRight size={13} /></a>. This product uses the TMDB API but is not endorsed or certified by TMDB. Playback is embedded from VidSrc; stream quality depends on the available source.</p></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
