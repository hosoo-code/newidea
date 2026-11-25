import { Metadata } from "next";
import PageTitle from "@/components/title/PageTitle";
import ResponsiveGrid from "@/components/layout/ResponsiveGrid";
import LocalMovieCard from "@/components/local/LocalMovieCard";
import Link from "next/link";
import { getLocalMoviesPage } from "@/lib/movies";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Бүх кино | Cineworld",
  description: "Cineworld дээр нэмэгдсэн бүх кино.",
};

const PAGE_SIZE = 24;

export default async function FilmsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { movies, total } = await getLocalMoviesPage(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="app-bg-enhanced mt-24">
      <PageTitle segments={[{ text: "Манай" }, { text: " Кинонууд", isPrimary: true }]} />
      {movies.length === 0 ? (
        <p className="text-center text-gray-400 py-20">Кино алга байна</p>
      ) : (
        <ResponsiveGrid>
          {movies.map((m) => (
            <LocalMovieCard key={m.id} movie={m} />
          ))}
        </ResponsiveGrid>
      )}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 py-10 text-sm text-white">
          {page > 1 && (
            <Link href={`/films?page=${page - 1}`} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700">
              ← Өмнөх
            </Link>
          )}
          <span className="text-gray-400">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`/films?page=${page + 1}`} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700">
              Дараах →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
