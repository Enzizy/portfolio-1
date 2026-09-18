import Image from "next/image";
import Link from "next/link";
import { Clapperboard, Play, Star } from "lucide-react";
import { mediaTypeLabel, tmdbImage, type TmdbTitle } from "@/lib/tmdb";

// Always the TMDB poster (2:3). Backdrops are film stills, not covers, so they never go on a card.
export function TitleCard({ title, index, sizes = "(max-width: 700px) 45vw, (max-width: 1100px) 24vw, 200px" }: { title: TmdbTitle; index?: number; sizes?: string }) {
  const poster = tmdbImage(title.poster_path, "w342");
  return (
    <Link className="movies-card" href={`/movies/${title.media_type}/${title.id}`}>
      <span className="movies-card__poster">
        {poster ? <Image src={poster} alt="" width={342} height={513} sizes={sizes} /> : <span className="movies-card__placeholder"><Clapperboard size={30} aria-hidden="true" /></span>}
        {title.vote_average > 0 && <span className="movies-card__rating"><Star size={10} fill="currentColor" aria-hidden="true" /> {title.vote_average.toFixed(1)}</span>}
        {index != null && <span className="movies-card__index" aria-hidden="true">{index}</span>}
        <span className="movies-card__play"><Play size={20} fill="currentColor" aria-hidden="true" /></span>
      </span>
      <span className="movies-card__meta">
        <strong>{title.title}</strong>
        <span>{title.year ?? "TBA"} · {mediaTypeLabel(title.media_type)}</span>
      </span>
    </Link>
  );
}
