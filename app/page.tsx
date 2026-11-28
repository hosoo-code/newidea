import { Metadata } from "next";
import Link from "next/link";
import { getLocalMovies, type LocalMovie } from "@/lib/movies";
import HomeHero from "@/components/local/HomeHero";
import MovieRow from "@/components/local/MovieRow";

export const metadata: Metadata = {
  title: "Нүүр | Kino Mangas",
  description: "Kino Mangas дээр нэмэгдсэн шинэ болон шилдэг кинонууд.",
};

export const revalidate = 60;

export default async function HomePage() {
  const all = await getLocalMovies(120);

  if (all.length === 0) {
    return (
      <div className="app-bg-enhanced mt-16 flex min-h-[60vh] items-center justify-center px-6 text-center">
        <p className="text-gray-400">Одоогоор кино нэмэгдээгүй байна.</p>
      </div>
    );
  }

  const [featured, ...rest] = all;
  const latest = rest.slice(0, 15);
  const topRated = [...all].filter((m) => Number(m.rating) > 0).sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 15);

  // Хамгийн олон кинотой 3 төрөл
  const byGenre = new Map<string, LocalMovie[]>();
  for (const m of all) for (const g of m.genres ?? []) byGenre.set(g, [...(byGenre.get(g) ?? []), m]);
  const genreRows = [...byGenre.entries()]
    .filter(([, list]) => list.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  return (
    <div className="app-bg-enhanced mt-16 pb-10">
      <HomeHero movie={featured} />
      <div className="container mx-auto space-y-8 px-4 pt-6 sm:space-y-10">
        <MovieRow title="Шинэ нэмэгдсэн" movies={latest} />
        <MovieRow title="Өндөр үнэлгээтэй" movies={topRated} />
        {genreRows.map(([genre, list]) => (
          <MovieRow key={genre} title={genre} movies={list.slice(0, 15)} />
        ))}
        {all.length > 15 && (
          <div className="pt-2 text-center">
            <Link href="/films" className="inline-block rounded-xl border border-gray-700 px-6 py-3 text-sm font-semibold text-white active:scale-95">
              Бүх киног үзэх ({all.length})
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
