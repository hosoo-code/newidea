import Link from "next/link";
import type { LocalMovie } from "@/lib/movies";

// Гар утсан дээр hover байхгүй тул нэр/он/үнэлгээ үргэлж харагдана.
export default function LocalMovieCard({
  movie,
  variant = "grid",
}: {
  movie: LocalMovie;
  variant?: "horizontal" | "grid";
}) {
  const width = variant === "horizontal" ? "w-[132px] sm:w-[160px] md:w-[190px]" : "w-full";
  const rating = Number(movie.rating ?? 0);
  return (
    <Link href={`/films/${movie.id}`} title={movie.title} className={`group block ${width} active:scale-[0.97] transition-transform`}>
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gray-800 ring-1 ring-white/10 group-hover:ring-theme-primary/60 transition-all">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.poster_url || "https://i.imgur.com/wjVuAGb.png"}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {rating > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-yellow-400 backdrop-blur-sm">
            ★ {rating.toFixed(1)}
          </span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-1 text-sm font-semibold text-white">{movie.title}</h3>
      <p className="text-xs text-gray-400">
        {movie.release_year ?? "—"}
        {movie.genres?.[0] ? ` · ${movie.genres[0]}` : ""}
      </p>
    </Link>
  );
}
