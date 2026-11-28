import { adminListCategories } from "@/lib/categories";
import MovieForm from "@/components/admin/MovieForm";

export const metadata = { title: "Кино нэмэх | Admin", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function NewMoviePage() {
  const categories = await adminListCategories().catch(() => []);
  return (
    <div className="app-bg-enhanced min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Кино нэмэх</h1>
        <MovieForm categories={categories} />
      </div>
    </div>
  );
}
