import Link from "next/link";
import type { LocalMovie } from "@/lib/movies";

export default function LocalMovieCard({
  movie,
  variant = "grid",
}: {
  movie: LocalMovie;
  variant?: "horizontal" | "grid";
}) {
  const width = variant === "horizontal" ? "w-[160px] sm:w-[180px] md:w-[200px]" : "w-full";
  return (
    <Link
      href={`/films/${movie.id}`}
      title={movie.title}
      className={`group relative block ${width} rounded-xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 hover:border-gray-600/80 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1`}
    >
      <div className="aspect-[2/3] w-full relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.poster_url || "https://i.imgur.com/wjVuAGb.png"}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {!!movie.rating && movie.rating > 0 && (
          <div className="absolute top-3 left-3 bg-black/80 px-2 py-1 rounded-lg border border-yellow-500/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-yellow-400 text-xs font-bold">⭐ {Number(movie.rating).toFixed(1)}</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/80 px-2 py-1 rounded-lg border border-gray-600/30">
            <h3 className="text-white text-xs font-semibold line-clamp-2 leading-tight">{movie.title}</h3>
          </div>
        </div>
      </div>
    </Link>
  );
}
