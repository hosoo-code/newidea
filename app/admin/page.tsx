import Link from "next/link";
import { adminListMovies } from "@/lib/movies";
import MovieRowActions from "@/components/admin/MovieRowActions";
import LogoutButton from "@/components/admin/LogoutButton";

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

  return (
    <div className="app-bg-enhanced min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white">Кинонууд ({movies.length})</h1>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/admin/plans" className="rounded-lg border border-theme-primary text-theme-primary font-semibold px-4 py-2 hover:bg-theme-primary/10">
              💳 Premium үнэ
            </Link>
            <LogoutButton />
            <Link href="/admin/movies/new" className="rounded-lg bg-theme-primary text-black font-semibold px-4 py-2">
              + Кино нэмэх
            </Link>
          </div>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="glass-container divide-y divide-gray-800">
          {movies.length === 0 && !error && (
            <p className="p-6 text-gray-400">Одоогоор кино алга. “Кино нэмэх” дээр дарна уу.</p>
          )}
          {movies.map((m) => (
            <div key={m.id} className="flex items-center gap-4 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.poster_url || "https://i.imgur.com/wjVuAGb.png"} alt="" className="w-12 h-[72px] rounded object-cover bg-gray-800" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{m.title}</p>
                <p className="text-xs text-gray-400">
                  {m.release_year ?? "—"} · ⭐ {m.rating ?? 0}
                  {!m.published && <span className="ml-2 text-yellow-400">Draft</span>}
                  {!m.video_url && <span className="ml-2 text-red-400">Видео алга</span>}
                </p>
              </div>
              <MovieRowActions id={m.id} title={m.title} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
