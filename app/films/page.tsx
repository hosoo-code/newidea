import { Metadata } from "next";
import PageTitle from "@/components/title/PageTitle";
import ResponsiveGrid from "@/components/layout/ResponsiveGrid";
import LocalMovieCard from "@/components/local/LocalMovieCard";
import Link from "next/link";
import { getFilterOptions, getLocalMoviesPage } from "@/lib/movies";
import { getCategories } from "@/lib/categories";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Бүх кино | Kino Mangas",
  description: "Kino Mangas дээр нэмэгдсэн бүх кино.",
};

const PAGE_SIZE = 24;
type SP = { page?: string; cat?: string; genre?: string; year?: string };

export default async function FilmsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const catId = Number.parseInt(sp.cat ?? "", 10) || undefined;
  const genre = sp.genre?.trim() || undefined;
  const year = Number.parseInt(sp.year ?? "", 10) || undefined;

  const [categories, options, { movies, total }] = await Promise.all([
    getCategories(),
    getFilterOptions(),
    getLocalMoviesPage(page, PAGE_SIZE, { categoryId: catId, genre, year }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Шүүлтүүрийг хадгалсан холбоос
  const href = (over: Partial<SP>) => {
    const q = new URLSearchParams();
    const next: SP = { cat: sp.cat, genre: sp.genre, year: sp.year, ...over };
    (Object.keys(next) as (keyof SP)[]).forEach((k) => next[k] && q.set(k, String(next[k])));
    const s = q.toString();
    return s ? `/films?${s}` : "/films";
  };

  const chip = (on: boolean) =>
    `shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
      on ? "border-theme-primary bg-theme-primary font-semibold text-black" : "border-gray-700 bg-gray-900/70 text-gray-300 hover:border-gray-500 hover:text-white"
    }`;
  const select = "rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-2 text-sm text-white outline-none focus:border-theme-primary";
  const hasFilter = !!(catId || genre || year);

  return (
    <div className="app-bg-enhanced mt-24">
      <PageTitle segments={[{ text: "Манай" }, { text: " Кинонууд", isPrimary: true }]} />

      <div className="container mx-auto space-y-4 px-4 pb-6">
        {/* Ангилал */}
        {categories.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
            <Link href={href({ cat: undefined, page: undefined })} className={chip(!catId)}>Бүгд</Link>
            {categories.map((c) => (
              <Link key={c.id} href={href({ cat: String(c.id), page: undefined })} className={chip(catId === c.id)}>
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {/* Төрөл, Он */}
        <form method="get" action="/films" className="flex flex-wrap items-center gap-2">
          {catId && <input type="hidden" name="cat" value={catId} />}
          <select name="genre" defaultValue={genre ?? ""} className={select} aria-label="Төрөл">
            <option value="">Бүх төрөл</option>
            {options.genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select name="year" defaultValue={year ?? ""} className={select} aria-label="Он">
            <option value="">Бүх он</option>
            {options.years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-theme-primary px-4 py-2 text-sm font-semibold text-black active:scale-95">Хайх</button>
          {hasFilter && (
            <Link href="/films" className="text-sm text-gray-400 underline hover:text-white">Арилгах</Link>
          )}
        </form>
      </div>

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
            <Link href={href({ page: String(page - 1) })} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700">
              ← Өмнөх
            </Link>
          )}
          <span className="text-gray-400">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={href({ page: String(page + 1) })} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700">
              Дараах →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
