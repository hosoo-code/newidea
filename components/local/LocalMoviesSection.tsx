import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLocalMovies } from "@/lib/movies";
import LocalMovieCard from "./LocalMovieCard";
import SectionHeader from "../layout/SectionHeader";

// Server component – нүүр хуудсанд хамгийн сүүлд нэмсэн кинонууд
export default async function LocalMoviesSection({ title = "Шинэ нэмэгдсэн кино" }: { title?: string }) {
  const movies = await getLocalMovies(10);
  if (movies.length === 0) return null;
  return (
    <div className="mb-12">
      <SectionHeader className="mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <Link href="/films" className="text-theme-primary inline-flex items-center text-sm hover:underline">
          See All <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </SectionHeader>
      <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 scrollbar-hide horizontal-scroll touch-scroll pl-4 sm:pl-0">
        {movies.map((m) => (
          <div key={m.id} className="flex-shrink-0 scroll-snap-align-start">
            <LocalMovieCard movie={m} variant="horizontal" />
          </div>
        ))}
        <div className="flex-shrink-0 w-4 sm:w-6" />
      </div>
    </div>
  );
}
