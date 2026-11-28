import Link from "next/link";
import { MOVIE_PRICE } from "@/lib/plans";

// Premium хуудсан дээрх "Нэг киног 4K (4,000₮)-өөр үзэх" сонголт.
// Үнийг серверээс (MOVIE_PRICE) авна. Худалдан авалт нь кино бүрийн хуудас (/films/[id]) дээр хийгдэнэ.
export default function SingleMovieCard() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/50 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-200">Зөвхөн нэг кино үзэх үү?</h3>
        <p className="text-sm text-gray-400">Premium авахгүйгээр хүссэн киногоо нэг удаагийн төлбөрөөр үргэлж үзнэ.</p>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2">
        <p className="text-2xl font-extrabold text-white">
          {MOVIE_PRICE.toLocaleString("en-US")}
          <span className="ml-0.5 text-lg text-theme-primary">₮</span>
          <span className="ml-1 text-sm font-medium text-gray-400">/ кино</span>
        </p>
        <Link
          href="/films"
          className="w-full rounded-xl border border-theme-primary px-5 py-2.5 text-center font-semibold text-theme-primary transition-transform active:scale-95"
        >
          Кино сонгох
        </Link>
      </div>
    </div>
  );
}
