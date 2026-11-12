// The old /movies section was removed for good. "410 Gone" tells search engines to drop
// every old /movies address instead of re-checking a redirect to an unrelated page.
function gone() {
  return new Response("This page has been permanently removed.", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}

export const GET = gone;
export const HEAD = gone;
