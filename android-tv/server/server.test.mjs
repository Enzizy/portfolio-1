import test from "node:test";
import assert from "node:assert/strict";
import { createCatalogServer } from "./server.mjs";

async function withServer(options, run) {
  const server = createCatalogServer(options);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test("normalizes and caches catalog data without returning credentials", async () => {
  let calls = 0;
  await withServer({ apiKey: "secret-test-key", fetcher: async url => {
    calls++;
    assert.equal(url.origin, "https://api.themoviedb.org");
    assert.equal(url.searchParams.get("api_key"), "secret-test-key");
    return Response.json({ results: [{ id: 1, title: "Example", poster_path: "/poster.jpg", vote_average: 7.5 }, { id: 2, adult: true }] });
  } }, async base => {
    const first = await (await fetch(`${base}/catalog?type=movie`)).json();
    assert.equal(first.items.length, 1);
    assert.equal(first.items[0].poster, "https://image.tmdb.org/t/p/w342/poster.jpg");
    assert.ok(!JSON.stringify(first).includes("secret-test-key"));
    assert.deepEqual(await (await fetch(`${base}/catalog?type=movie`)).json(), first);
    assert.equal(calls, 1);
  });
});

test("rejects unsupported routes and invalid IDs before fetching", async () => {
  await withServer({ apiKey: "key", fetcher: () => { throw new Error("Must not fetch"); } }, async base => {
    for (const route of ["/catalog?type=person", "/titles/movie/0", "/titles/movie/1/seasons/1", "/search?q=", "/proxy?url=https://example.com"]) {
      assert.equal((await fetch(base + route)).status, 400);
    }
    assert.equal((await fetch(base + "/catalog", { method: "POST" })).status, 405);
  });
});

test("supports bearer tokens and TV specials without leaking upstream failures", async () => {
  await withServer({ apiKey: "token.with.dots", fetcher: async (url, options) => {
    assert.equal(options.headers.Authorization, "Bearer token.with.dots");
    assert.equal(url.pathname, "/3/tv/123/season/0");
    return Response.json({ episodes: [{ episode_number: 1, name: "Special" }] });
  } }, async base => {
    assert.deepEqual(await (await fetch(base + "/titles/tv/123/seasons/0")).json(), { episodes: [{ number: 1, name: "Special" }] });
  });
  await withServer({ apiKey: "key", fetcher: async () => new Response("sensitive upstream error", { status: 401 }) }, async base => {
    const response = await fetch(base + "/catalog");
    assert.equal(response.status, 502);
    assert.ok(!(await response.text()).includes("sensitive"));
  });
});

test("reports missing configuration and missing titles", async () => {
  await withServer({ apiKey: "" }, async base => {
    assert.equal((await fetch(base + "/catalog")).status, 503);
  });
  await withServer({ apiKey: "key", fetcher: async () => new Response(null, { status: 404 }) }, async base => {
    assert.equal((await fetch(base + "/titles/movie/1")).status, 404);
  });
});
