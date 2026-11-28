import { Metadata } from "next";
import PageTitle from "@/components/title/PageTitle";
import WatchListClient from "@/components/watchlist/WatchListClient";

export const metadata: Metadata = {
  title: "Миний жагсаалт | Kino Mangas",
  description:
    "Kino Mangas дээрх өөрийн хадгалсан кино, цувралын жагсаалт.",
};

export default function WatchlistPage() {
  return (
    <div className="app-bg-enhanced mt-24">
      <PageTitle
        segments={[
          { text: "Миний " },
          { text: "Watch", isPrimary: true },
          { text: "list" },
        ]}
      />
      <WatchListClient />
    </div>
  );
}
