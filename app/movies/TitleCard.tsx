import Image from "next/image";
import Link from "next/link";
import { Clapperboard, Play, Star } from "lucide-react";
import { mediaTypeLabel, tmdbImage, type TmdbTitle } from "@/lib/tmdb";

export function TitleCard({ title, index }: { title: TmdbTitle; index?: number }) {
  const poster = tmdbImage(title.poster_path, "w342");
  return (
    <Link className="movies-card" href={`/movies/${title.media_type}/${title.id}`}>
      <span className="movies-card__poster">
        {poster ? <Image src={poster} alt="" width={342} height={513} sizes="(max-width: 700px) 45vw, (max-width: 980px) 30vw, 220px" /> : <span className="movies-card__placeholder"><Clapperboard size={30} aria-hidden="true" /></span>}
        <span className="movies-card__play"><Play size={20} fill="currentColor" aria-hidden="true" /></span>
        {index != null && <small className="movies-card__index">{String(index).padStart(2, "0")}</small>}
      </span>
      <span className="movies-card__meta">
        <strong>{title.title}</strong>
        <span><span>{title.year ?? "TBA"} / {mediaTypeLabel(title.media_type).toUpperCase()}</span>{title.vote_average > 0 && <span><Star size={11} fill="currentColor" aria-hidden="true" /> {title.vote_average.toFixed(1)}</span>}</span>
      </span>
    </Link>
  );
}
