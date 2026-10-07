import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const image = (path, size) => typeof path === "string" && /^\/[\w.-]+$/.test(path)
  ? `https://image.tmdb.org/t/p/${size}${path}` : null;

function title(raw, type) {
  return {
    id: raw.id,
    mediaType: type,
    title: raw.title || raw.name || "Untitled",
    overview: raw.overview || "",
    year: (raw.release_date || raw.first_air_date || "").slice(0, 4),
    poster: image(raw.poster_path, "w342"),
    backdrop: image(raw.backdrop_path, "w1280"),
    rating: typeof raw.vote_average === "number" ? raw.vote_average : 0,
  };
}

// Fixed route mapping prevents this server becoming an arbitrary URL proxy.
function resolveRoute(url) {
  const type = url.searchParams.get("type") || "movie";
  if (!['movie', 'tv'].includes(type)) return null;
  if (url.pathname === "/catalog") return { path: `trending/${type}/week`, params: {}, type, kind: "list" };
  if (url.pathname === "/search") {
    const query = url.searchParams.get("q")?.trim();
    if (!query || query.length > 100) return null;
    return { path: `search/${type}`, params: { query, include_adult: "false" }, type, kind: "list" };
  }
  const match = url.pathname.match(/^\/titles\/(movie|tv)\/([1-9]\d{0,8})(?:\/seasons\/(\d{1,3}))?$/);
  if (!match || (match[3] !== undefined && match[1] !== "tv")) return null;
  return {
    path: `${match[1]}/${match[2]}${match[3] !== undefined ? `/season/${Number(match[3])}` : ""}`,
    params: {}, type: match[1], kind: match[3] !== undefined ? "season" : "details",
  };
}

export function createCatalogServer({ apiKey = process.env.TMDB_API_KEY, fetcher = fetch } = {}) {
  const cache = new Map();
  return createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" });
      res.end(JSON.stringify(body));
    };
    if (req.method !== "GET") return send(405, { error: "Only GET is supported." });
    const url = new URL(req.url, "http://catalog.local");
    if (url.pathname === "/health") return send(200, { status: "ok", configured: Boolean(apiKey) });
    const route = resolveRoute(url);
    if (!route) return send(400, { error: "Invalid catalog request." });
    if (!apiKey) return send(503, { error: "Catalog is not configured." });
    const upstream = new URL(route.path, "https://api.themoviedb.org/3/");
    Object.entries(route.params).forEach(([key, value]) => upstream.searchParams.set(key, value));
    const cacheKey = upstream.href;
    const saved = cache.get(cacheKey);
    if (saved && saved.expires > Date.now()) return send(200, saved.body);
    const headers = { Accept: "application/json" };
    if (apiKey.includes(".")) headers.Authorization = `Bearer ${apiKey}`;
    else upstream.searchParams.set("api_key", apiKey);
    try {
      const response = await fetcher(upstream, { headers, signal: AbortSignal.timeout(12_000) });
      if (response.status === 404) return send(404, { error: "Title or season was not found." });
      if (!response.ok) return send(502, { error: "Catalog provider is unavailable. Try again shortly." });
      const raw = await response.json();
      let body;
      if (route.kind === "list") {
        if (!Array.isArray(raw.results)) throw new Error("Invalid list response");
        body = { items: raw.results.filter(item => Number.isSafeInteger(item.id) && item.id > 0 && !item.adult).map(item => title(item, route.type)) };
      } else if (route.kind === "season") {
        if (!Array.isArray(raw.episodes)) throw new Error("Invalid season response");
        body = { episodes: raw.episodes.filter(item => Number.isInteger(item.episode_number) && item.episode_number > 0).map(item => ({ number: item.episode_number, name: item.name || `Episode ${item.episode_number}` })) };
      } else {
        if (!Number.isSafeInteger(raw.id)) throw new Error("Invalid title response");
        body = { ...title(raw, route.type), seasons: (raw.seasons || []).filter(s => Number.isInteger(s.season_number) && s.season_number >= 0 && s.episode_count > 0).map(s => ({ number: s.season_number, name: s.name || `Season ${s.season_number}` })) };
      }
      if (cache.size >= 200) cache.delete(cache.keys().next().value);
      cache.set(cacheKey, { body, expires: Date.now() + 300_000 });
      send(200, body);
    } catch {
      send(502, { error: "Could not reach the catalog provider. Try again shortly." });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 8787);
  const host = process.env.HOST || "127.0.0.1";
  createCatalogServer().listen(port, host, () => console.log(`Screen Room catalog listening on ${host}:${port}`));
}
