"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MovieRowActions({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  async function del() {
    if (!confirm(`"${title}" киног устгах уу?`)) return;
    const res = await fetch(`/api/admin/movies/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Устгагдлаа");
      router.refresh();
    } else toast.error("Устгаж чадсангүй");
  }
  return (
    <div className="flex flex-col sm:flex-row gap-2 text-sm shrink-0">
      <Link href={`/admin/movies/${id}`} className="rounded-lg border border-gray-700 px-3 py-1.5 text-center text-theme-primary hover:border-theme-primary">
        Засах
      </Link>
      <button onClick={del} className="rounded-lg border border-gray-700 px-3 py-1.5 text-red-400 hover:border-red-400">
        Устгах
      </button>
    </div>
  );
}
