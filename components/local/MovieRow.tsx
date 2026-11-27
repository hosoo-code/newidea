import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LocalMovie } from "@/lib/movies";
import LocalMovieCard from "./LocalMovieCard";

// Хажуу тийш гүйлгэх мөр. Утсан дээр дэлгэцийн ирмэг хүртэл гүйлгэгдэнэ.
export default function MovieRow({ title, movies, href = "/films" }: { title: string; movies: LocalMovie[]; href?: string }) {
  if (movies.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-bold text-white sm:text-2xl">{title}</h2>
        <Link href={href} className="inline-flex items-center text-xs text-theme-primary sm:text-sm">
          Бүгд <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:gap-4">
        {movies.map((m) => (
          <div key={m.id} className="shrink-0 snap-start">
            <LocalMovieCard movie={m} variant="horizontal" />
          </div>
        ))}
        <div className="w-1 shrink-0" />
      </div>
    </section>
  );
}
