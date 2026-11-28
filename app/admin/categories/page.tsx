import Link from "next/link";
import { adminListCategories, type Category } from "@/lib/categories";
import CategoriesManager from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ангилал | Admin", robots: { index: false } };

export default async function AdminCategoriesPage() {
  let categories: Category[] = [];
  let error: string | null = null;
  try {
    categories = await adminListCategories();
  } catch {
    error = "Ангилал уншиж чадсангүй. supabase/migrations_005_categories.sql-ийг Supabase дээр ажиллуулсан эсэхийг шалгана уу.";
  }
  return (
    <div className="app-bg-enhanced min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">Киноны ангилал</h1>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white">← Кинонууд</Link>
        </div>
        {error ? <p className="text-red-400">{error}</p> : <CategoriesManager initial={categories} />}
      </div>
    </div>
  );
}
