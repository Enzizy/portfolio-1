"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SEEN_KEY = "movies-curtain-seen";

/**
 * The house lights. The curtain itself is server-rendered markup animated purely by
 * CSS off `html[data-movies-curtain="show"]`, so a hard load paints it closed on the
 * very first frame with no flash of the page behind it.
 *
 * The pre-paint script in the root layout sets that attribute for hard loads. This
 * component covers the other route in: a client-side navigation from elsewhere in the
 * portfolio, where no document script runs.
 */
export function MovieCurtain() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const onMovies = pathname === "/movies" || pathname.startsWith("/movies/");

    if (!onMovies) {
      delete root.dataset.moviesCurtain;
      return;
    }
    // Already decided before paint — leave it alone, or the animation restarts.
    if (root.dataset.moviesCurtain) return;

    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch { /* Private mode: show it, just don't remember. */ }
    root.dataset.moviesCurtain = seen ? "skip" : "show";
  }, [pathname]);

  return null;
}

/** The curtain markup. Rendered by the server so it is present on the first paint. */
export function MovieCurtainStage() {
  return (
    <div className="movies-curtain" aria-hidden="true">
      <div className="movies-curtain__panel movies-curtain__panel--left" />
      <div className="movies-curtain__panel movies-curtain__panel--right" />
      <div className="movies-curtain__card">
        <span className="movies-curtain__mark">ZB<i>.</i></span>
        <strong>Screen Room</strong>
        <span className="movies-curtain__sub">Now showing</span>
      </div>
    </div>
  );
}
