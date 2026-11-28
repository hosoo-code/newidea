import Link from "next/link";
import { adminListMovies } from "@/lib/movies";
import MovieRowActions from "@/components/admin/MovieRowActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | Kino Mangas", robots: { index: false } };

export default async function AdminPage() {
  let movies: Awaited<ReturnType<typeof adminListMovies>> = [];
  let error: string | null = null;
  try {
    movies = await adminListMovies();
  } catch (e) {
    error = e instanceof Error ? e.message : "Өгөгдөл уншиж чадсангүй";
  }

  const drafts = movies.filter((m) => !m.published).length;
  return (
    <div className="app-bg-enhanced min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Кинонууд</h1>
            <p className="text-sm text-gray-400">
              Нийт {movies.length}{drafts > 0 && ` · ${drafts} draft`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/categories" className="rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm text-white hover:border-gray-500">
              Ангилал
            </Link>
            <Link href="/admin/plans" className="rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm text-white hover:border-gray-500">
              Багцууд
            </Link>
            <Link href="/admin/movies/new" className="rounded-xl bg-theme-primary text-black font-bold px-4 py-2.5 text-sm active:scale-95 transition-all">
              + Кино нэмэх
            </Link>
          </div>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="space-y-3">
          {movies.length === 0 && !error && (
            <p className="rounded-2xl border border-gray-800 bg-gray-900/40 p-8 text-center text-gray-400">
              Одоогоор кино алга. “Кино нэмэх” дээр дарна уу.
            </p>
          )}
          {movies.map((m) => (
            <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900/40 p-3 hover:border-gray-700 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.poster_url || "https://i.imgur.com/wjVuAGb.png"} alt="" className="w-14 h-20 rounded-lg object-cover bg-gray-800 shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-white font-semibold truncate">{m.title}</p>
                <p className="text-xs text-gray-400">
                  {m.release_year ?? "—"} · ⭐ {m.rating ?? 0}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {m.published ? (
                    <span className="rounded-full bg-green-500/15 text-green-400 px-2 py-0.5 text-[11px]">Нийтлэгдсэн</span>
                  ) : (
                    <span className="rounded-full bg-yellow-500/15 text-yellow-400 px-2 py-0.5 text-[11px]">Draft</span>
                  )}
                  {!m.video_url && <span className="rounded-full bg-red-500/15 text-red-400 px-2 py-0.5 text-[11px]">Видео алга</span>}
                </div>
              </div>
              <MovieRowActions id={m.id} title={m.title} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
