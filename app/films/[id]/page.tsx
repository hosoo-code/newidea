import { Metadata } from "next";
import InfoNotFound from "@/components/not-found/InfoNotFound";
import MediaDetailLayout from "@/components/layout/MediaDetailLayout";
import LocalPlayer from "@/components/local/LocalPlayer";
import { getLocalMovie } from "@/lib/movies";
import { signPlaybackUrl } from "@/lib/r2";
import { getCurrentProfile, isPremium } from "@/lib/auth";
import Link from "next/link";

// Signed URL тул хуудас бүрт шинээр үүснэ (cache хийхгүй)
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = Number.isInteger(Number(id)) ? await getLocalMovie(Number(id)) : null;
  return {
    title: movie ? `${movie.title} | Kino Mangas` : "Кино | Kino Mangas",
    description: movie?.overview?.slice(0, 160) ?? undefined,
  };
}

export default async function FilmDetailPage({ params }: Props) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return <InfoNotFound />;
  const movie = await getLocalMovie(n);
  if (!movie) return <InfoNotFound />;
  // Premium (эсвэл admin) эрхтэй хэрэглэгчид л signed видео URL үүсгэнэ
  const profile = await getCurrentProfile();
  const allowed = isPremium(profile);
  const playUrl = allowed && movie.video_url ? await signPlaybackUrl(movie.video_url) : null;

  return (
    <MediaDetailLayout className="pt-16">
      <div className="space-y-8 lg:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1 max-w-xs mx-auto lg:mx-0 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movie.poster_url || "https://i.imgur.com/wjVuAGb.png"}
              alt={`${movie.title} poster`}
              className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl"
            />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              {movie.title}
              {movie.release_year && <span className="text-gray-400 font-normal"> ({movie.release_year})</span>}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
              {!!movie.rating && movie.rating > 0 && (
                <span className="text-yellow-400 font-semibold">⭐ {Number(movie.rating).toFixed(1)}</span>
              )}
              {movie.runtime && <span>{movie.runtime} мин</span>}
            </div>
            {!!movie.genres?.length && (
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((g) => (
                  <span key={g} className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs text-white">
                    {g}
                  </span>
                ))}
              </div>
            )}
            {movie.overview && <p className="text-gray-300 leading-relaxed">{movie.overview}</p>}
          </div>
        </div>

        {!allowed && movie.video_url ? (
          <div className="glass-container p-8 text-center space-y-4">
            <p className="text-white text-lg font-semibold">Энэ киног үзэхэд Premium эрх шаардлагатай</p>
            <Link
              href={profile ? "/premium" : "/login?next=/premium"}
              className="inline-block rounded-lg bg-theme-primary text-black font-semibold px-5 py-2"
            >
              {profile ? "Premium авах" : "Нэвтэрч Premium авах"}
            </Link>
          </div>
        ) : playUrl ? (
          <LocalPlayer url={playUrl} title={movie.title} poster={movie.backdrop_url} movieId={movie.id} viewerId={profile?.id} />
        ) : (
          <p className="text-gray-400 text-center py-10">Видео удахгүй нэмэгдэнэ.</p>
        )}
      </div>
    </MediaDetailLayout>
  );
}
