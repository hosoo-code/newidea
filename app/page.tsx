import { Metadata } from "next";
import Link from "next/link";
import { getLocalMovies, getLocalMoviesByCategory } from "@/lib/movies";
import { getCategories } from "@/lib/categories";
import HomeHero from "@/components/local/HomeHero";
import MovieRow from "@/components/local/MovieRow";

export const metadata: Metadata = {
  title: "Нүүр | Kino Mangas",
  description: "Kino Mangas дээр нэмэгдсэн шинэ болон шилдэг кинонууд.",
};

export const revalidate = 60;

export default async function HomePage() {
  const [all, categories] = await Promise.all([getLocalMovies(60), getCategories()]);

  if (all.length === 0) {
    return (
      <div className="app-bg-enhanced mt-16 flex min-h-[60vh] items-center justify-center px-6 text-center">
        <p className="text-gray-400">Одоогоор кино нэмэгдээгүй байна.</p>
      </div>
    );
  }

  // Admin-ы үүсгэсэн ангилал бүр нэг мөр (нүүрэнд харуулахаар тохируулсан, кинотой нь)
  const rows = await Promise.all(
    categories
      .filter((c) => c.show_on_home)
      .map(async (c) => ({ category: c, movies: await getLocalMoviesByCategory(c.id, 15) }))
  );
  const visibleRows = rows.filter((r) => r.movies.length > 0);

  // Баннер: "баннерт ашиглах" ангиллын хамгийн шинэ кино, байхгүй бол хамгийн шинэ кино
  const heroCat = categories.find((c) => c.is_hero);
  const heroMovies = heroCat ? await getLocalMoviesByCategory(heroCat.id, 1) : [];
  const featured = heroMovies[0] ?? all[0];
  const badge = heroMovies[0] && heroCat ? heroCat.name : "Шинэ";

  return (
    <div className="app-bg-enhanced mt-16 pb-10">
      <HomeHero movie={featured} badge={badge} />
      <div className="container mx-auto space-y-8 px-4 pt-6 sm:space-y-10">
        {visibleRows.length > 0 ? (
          visibleRows.map(({ category, movies }) => (
            <MovieRow key={category.id} title={category.name} movies={movies} href={`/films?cat=${category.id}`} />
          ))
        ) : (
          // Ангилал хараахан үүсээгүй/кино оноогоогүй үед хоосон харагдахгүйн тулд
          <MovieRow title="Шинэ нэмэгдсэн" movies={all.slice(0, 15)} />
        )}
        <div className="pt-2 text-center">
          <Link href="/films" className="inline-block rounded-xl border border-gray-700 px-6 py-3 text-sm font-semibold text-white active:scale-95">
            Бүх киног үзэх
          </Link>
        </div>
      </div>
    </div>
  );
}
