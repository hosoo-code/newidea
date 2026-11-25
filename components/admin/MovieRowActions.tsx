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
    <div className="flex gap-3 text-sm">
      <Link href={`/admin/movies/${id}`} className="text-theme-primary hover:underline">
        Засах
      </Link>
      <button onClick={del} className="text-red-400 hover:underline">
        Устгах
      </button>
    </div>
  );
}
