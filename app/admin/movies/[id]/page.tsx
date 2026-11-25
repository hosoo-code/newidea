import { notFound } from "next/navigation";
import MovieForm from "@/components/admin/MovieForm";
import { adminGetMovie } from "@/lib/movies";

export const dynamic = "force-dynamic";
export const metadata = { title: "Кино засах | Admin", robots: { index: false } };

export default async function EditMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await adminGetMovie(Number(id));
  if (!movie) notFound();
  return (
    <div className="app-bg-enhanced min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Кино засах</h1>
        <MovieForm movie={movie} />
      </div>
    </div>
  );
}
