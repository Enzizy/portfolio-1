import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { NotFoundActions } from "@/components/NotFoundActions";
import { CatSprite } from "@/components/pixel-cat/CatSprite";

export default function NotFound() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell not-found" tabIndex={-1}>
        <div className="not-found__copy">
          <p className="eyebrow">// ERROR 404</p>
          <h1>The cat wandered off with this page.</h1>
          <p>
            This address may have moved, or the page never existed. The rest of
            the portfolio is still right where you left it.
          </p>
          <NotFoundActions />
        </div>
        <div className="not-found__scene" aria-hidden="true">
          <span className="not-found__code">404</span>
          <span className="not-found__trail">· · · · ·</span>
          <span className="not-found__cat">
            <CatSprite pose="curious" tick={4} />
          </span>
        </div>
      </main>
      <Footer />
    </>
  );
}
