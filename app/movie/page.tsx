import { Metadata } from "next";
import { Suspense } from "react";
import PageTitle from "@/components/title/PageTitle";
import MoviePageClient from "@/components/movie/MoviePageClient";
import {PageLoading} from "@/components/loading/PageLoading";

export const metadata: Metadata = {
  title: "Бүх кинонууд | Kino Mangas",
  description:
    "Kino Mangas дээрх бүх кино. Трэнд, өндөр үнэлгээтэй болон шинэ кинонуудыг үзээрэй.",
};

export default function MoviePage() {
  return (
    <div className="app-bg-enhanced mt-24">
      <PageTitle
        segments={[{ text: "All" }, { text: " Movies", isPrimary: true }]}
      />

      <Suspense fallback={<PageLoading>Кинонуудыг ачаалж байна...</PageLoading>}>
        <MoviePageClient />
      </Suspense>
    </div>
  );
}
