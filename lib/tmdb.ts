import { cache } from "react";

export type MediaType = "movie" | "tv";

export type TmdbTitle = {
  id: number;
  media_type: MediaType;
  title: string;
  year: number | null;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
};

export type TmdbEpisode = {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  runtime: number | null;
  still_path: string | null;
};

export type TmdbSeasonSummary = {
  season_number: number;
  name: string;
  episode_count: number;
};

export type TmdbDetails = TmdbTitle & {
  tagline: string | null;
  genres: string[];
  runtime: number | null;
  release_date: string | null;
  status: string | null;
  original_language: string | null;
  vote_count: number;
  cast: string[];
  seasons: TmdbSeasonSummary[];
  number_of_seasons: number | null;
  number_of_episodes: number | null;
};

export type TitleListResponse = {
  titles: TmdbTitle[];
  page: number;
  total_pages: number;
  total_results: number;
};

type RawTitle = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
};

type RawDetails = RawTitle & {
  tagline?: string | null;
  genres?: Array<{ id: number; name: string }>;
  runtime?: number | null;
  episode_run_time?: number[];
  status?: string | null;
  original_language?: string | null;
  vote_count?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Array<{ season_number: number; name: string; episode_count: number }>;
  credits?: { cast?: Array<{ name: string }> };
};

type RawSeason = { episodes?: Array<Omit<TmdbEpisode, "air_date" | "runtime" | "still_path"> & { air_date?: string | null; runtime?: number | null; still_path?: string | null }> };

const TMDB_BASE = "https://api.themoviedb.org/3/";
const IMAGE_BASE = "https://image.tmdb.org/t/p/";

export function tmdbImage(path: string | null | undefined, size: "w342" | "w500" | "w780" | "w1280" | "original" = "w500") {
  return path ? `${IMAGE_BASE}${size}${path}` : null;
}

function yearOf(date: string | undefined | null) {
  const year = date ? Number(date.slice(0, 4)) : NaN;
  return Number.isSafeInteger(year) && year > 1800 ? year : null;
}

function normalizeTitle(raw: RawTitle, fallbackType: MediaType): TmdbTitle | null {
  if (!raw || !Number.isSafeInteger(raw.id) || raw.id <= 0) return null;
  const media_type: MediaType = raw.media_type === "tv" || raw.media_type === "movie" ? raw.media_type : fallbackType;
  const title = (media_type === "movie" ? raw.title : raw.name) ?? raw.title ?? raw.name;
  if (!title) return null;
  return {
    id: raw.id,
    media_type,
    title,
    year: yearOf(media_type === "movie" ? raw.release_date : raw.first_air_date),
    overview: raw.overview ?? "",
    poster_path: raw.poster_path ?? null,
    backdrop_path: raw.backdrop_path ?? null,
    vote_average: typeof raw.vote_average === "number" ? raw.vote_average : 0,
  };
}

async function tmdbRequest<T>(path: string, params: Record<string, string>, revalidate: number): Promise<T | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not configured");

  const url = new URL(path, TMDB_BASE);
  url.searchParams.set("language", "en-US");
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  // TMDB accepts either a v3 API key (query param) or a v4 read-access token (bearer).
  const headers: Record<string, string> = { Accept: "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  else url.searchParams.set("api_key", key);

  const response = await fetch(url, { headers, next: { revalidate } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`TMDB request failed (${response.status})`);
  return response.json() as Promise<T>;
}

type RawList = { page: number; total_pages: number; total_results: number; results: RawTitle[] };

function normalizeList(result: RawList | null, type: MediaType): TitleListResponse {
  if (!result || !Array.isArray(result.results)) throw new Error("TMDB returned no catalog");
  return {
    page: result.page,
    total_pages: Math.min(result.total_pages, 500),
    total_results: result.total_results,
    titles: result.results.map((item) => normalizeTitle(item, type)).filter((item): item is TmdbTitle => item !== null),
  };
}

export async function getTrending(type: MediaType, page: number) {
  const result = await tmdbRequest<RawList>(`trending/${type}/week`, { page: String(page) }, 21_600);
  return normalizeList(result, type);
}

export async function getPopular(type: MediaType, page: number) {
  const result = await tmdbRequest<RawList>(`${type}/popular`, { page: String(page) }, 21_600);
  return normalizeList(result, type);
}

export async function searchTitles(query: string, type: MediaType, page: number) {
  const result = await tmdbRequest<RawList>(`search/${type}`, { query, page: String(page), include_adult: "false" }, 86_400);
  return normalizeList(result, type);
}

export const getDetails = cache(async (type: MediaType, id: number): Promise<TmdbDetails | null> => {
  const raw = await tmdbRequest<RawDetails>(`${type}/${id}`, { append_to_response: "credits" }, 21_600);
  if (!raw) return null;
  const base = normalizeTitle({ ...raw, media_type: type }, type);
  if (!base) return null;

  return {
    ...base,
    tagline: raw.tagline?.trim() || null,
    genres: raw.genres?.map((genre) => genre.name) ?? [],
    runtime: raw.runtime ?? raw.episode_run_time?.[0] ?? null,
    release_date: (type === "movie" ? raw.release_date : raw.first_air_date) || null,
    status: raw.status ?? null,
    original_language: raw.original_language ?? null,
    vote_count: raw.vote_count ?? 0,
    cast: raw.credits?.cast?.slice(0, 8).map((person) => person.name) ?? [],
    seasons: (raw.seasons ?? []).filter((season) => season.season_number > 0 && season.episode_count > 0),
    number_of_seasons: raw.number_of_seasons ?? null,
    number_of_episodes: raw.number_of_episodes ?? null,
  };
});

export const getSeason = cache(async (id: number, season: number): Promise<TmdbEpisode[]> => {
  const raw = await tmdbRequest<RawSeason>(`tv/${id}/season/${season}`, {}, 21_600);
  return (raw?.episodes ?? []).map((episode) => ({
    id: episode.id,
    episode_number: episode.episode_number,
    name: episode.name,
    overview: episode.overview ?? "",
    air_date: episode.air_date ?? null,
    runtime: episode.runtime ?? null,
    still_path: episode.still_path ?? null,
  }));
});

export async function getRecommendations(type: MediaType, id: number): Promise<TmdbTitle[]> {
  try {
    const result = await tmdbRequest<RawList>(`${type}/${id}/recommendations`, {}, 86_400);
    return normalizeList(result, type).titles.slice(0, 8);
  } catch {
    return [];
  }
}

export function mediaTypeLabel(type: MediaType) {
  return type === "movie" ? "Movie" : "TV series";
}

export function isMediaType(value: string): value is MediaType {
  return value === "movie" || value === "tv";
}

// VidSrc embeds a player for a TMDB id. No key required.
const VIDSRC_BASE = "https://vidsrc.sbs/embed/";

export function vidsrcEmbedUrl(type: MediaType, id: number, season?: number, episode?: number) {
  const path = type === "movie" ? `movie/${id}` : `tv/${id}/${season ?? 1}/${episode ?? 1}`;
  return new URL(path, VIDSRC_BASE).href;
}
