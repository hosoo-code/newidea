import { Metadata } from "next";
import { Suspense } from "react";
import PageTitle from "@/components/title/PageTitle";
import SeriesPageClient from "@/components/series/SeriesPageClient";
import {PageLoading} from "@/components/loading/PageLoading";

export const metadata: Metadata = {
  title: "Бүх цуврал | Kino Mangas",
  description:
    "Kino Mangas дээрх бүх цуврал. Трэнд, өндөр үнэлгээтэй болон шинэ цувралуудыг үзээрэй.",
};

export default function SeriesPage() {
  return (
    <div className="app-bg-enhanced mt-24">
      <PageTitle
        segments={[
          { text: "TV Shows &" },
          { text: " Series", isPrimary: true },
        ]}
      />

      <Suspense fallback={<PageLoading>Цувралуудыг ачаалж байна...</PageLoading>}>
        <SeriesPageClient />
      </Suspense>
    </div>
  );
}
