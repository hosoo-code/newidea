import Link from "next/link";
import { Play } from "lucide-react";
import type { LocalMovie } from "@/lib/movies";

// Нүүрний том баннер – admin-ы сонгосон ангиллын (жишээ нь Онцлох) хамгийн сүүлийн кино, эс бөгөөс хамгийн шинэ кино
export default function HomeHero({ movie, badge = "Шинэ" }: { movie: LocalMovie; badge?: string }) {
  const img = movie.backdrop_url || movie.poster_url || "https://i.imgur.com/wjVuAGb.png";
  const rating = Number(movie.rating ?? 0);
  return (
    <section className="relative h-[68vh] min-h-[420px] max-h-[640px] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-black/50 to-black/20" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl space-y-3 px-4 pb-8 sm:px-8">
        <span className="inline-block rounded-md bg-theme-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-black">
          {badge}
        </span>
        <h1 className="line-clamp-2 text-3xl font-extrabold leading-tight text-white sm:text-5xl">{movie.title}</h1>
        <p className="text-sm text-gray-200">
          {rating > 0 && <span className="font-semibold text-yellow-400">★ {rating.toFixed(1)}</span>}
          {movie.release_year ? ` · ${movie.release_year}` : ""}
          {movie.runtime ? ` · ${movie.runtime} мин` : ""}
        </p>
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {movie.genres.slice(0, 3).map((g) => (
              <span key={g} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-sm">
                {g}
              </span>
            ))}
          </div>
        )}
        {movie.overview && <p className="line-clamp-2 max-w-xl text-sm text-gray-300">{movie.overview}</p>}
        <Link
          href={`/films/${movie.id}`}
          className="mt-1 inline-flex items-center gap-2 rounded-xl bg-theme-primary px-6 py-3 font-semibold text-black active:scale-95 transition-transform"
        >
          <Play className="h-5 w-5 fill-current" /> Үзэх
        </Link>
      </div>
    </section>
  );
}
