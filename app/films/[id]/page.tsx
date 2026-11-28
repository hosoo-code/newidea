import { Metadata } from "next";
import InfoNotFound from "@/components/not-found/InfoNotFound";
import MediaDetailLayout from "@/components/layout/MediaDetailLayout";
import LocalPlayer from "@/components/local/LocalPlayer";
import { getLocalMovie } from "@/lib/movies";
import { signPlaybackUrl } from "@/lib/r2";
import { getCurrentProfile, isPremium } from "@/lib/auth";
import { isMovieFree } from "@/lib/categories";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasPurchasedMovie } from "@/lib/purchases";
import { recoverRecentPayments } from "@/lib/payments";
import { MOVIE_PRICE } from "@/lib/plans";
import PremiumClient from "@/components/premium/PremiumClient";

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
  // "Үнэгүй" ангиллын кино: Premium-гүй, нэвтрээгүй хүн ч үзнэ
  const free = await isMovieFree(movie.category_ids);
  const purchased = await hasPurchasedMovie(profile?.id, movie.id);
  const allowed = free || isPremium(profile) || purchased;
  // Төлсөн ч баталгаажаагүй (webhook ирээгүй) төлбөр байвал Wire-аас шалгаж, эрх нээгдсэн бол хуудсыг шинээр ачаална
  if (profile && !allowed && movie.video_url && (await recoverRecentPayments(profile.id))) redirect(`/films/${n}`);
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
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="-mt-2 text-sm italic text-gray-400">{movie.original_title}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
              {!!movie.rating && movie.rating > 0 && (
                <span className="text-yellow-400 font-semibold">⭐ {Number(movie.rating).toFixed(1)}</span>
              )}
              {movie.runtime && <span>{movie.runtime} мин</span>}
              {free && <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">Үнэгүй</span>}
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
          <div className="glass-container p-6 sm:p-8 text-center space-y-5 max-w-md mx-auto w-full">
            <p className="text-white text-lg font-semibold">Энэ киног үзэхийн тулд сонголтоо хийнэ үү</p>

            <div className="space-y-2">
              <PremiumClient
                mode="movie"
                plans={[{ id: "movie", label: movie.title, amount: MOVIE_PRICE, days: 0 }]}
                extraBody={{ kind: "movie", movieId: movie.id }}
                loginNext={`/films/${movie.id}`}
              />
              <p className="text-xs text-gray-400">Зөвхөн энэ киног, нэг удаагийн төлбөрөөр үргэлж үзнэ.</p>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="h-px flex-1 bg-gray-700" /> эсвэл <span className="h-px flex-1 bg-gray-700" />
            </div>

            <div className="space-y-2">
              <Link
                href={profile ? "/premium" : "/login?next=/premium"}
                className="block rounded-xl border border-theme-primary py-3 font-semibold text-theme-primary active:scale-[0.98] transition-transform"
              >
                {profile ? "Premium авч бүх киног үзэх" : "Нэвтэрч Premium авах"}
              </Link>
              <p className="text-xs text-gray-400">Бүх киног хязгааргүй үзнэ.</p>
            </div>
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
