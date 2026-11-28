"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { Category } from "@/lib/categories";

export default function CategoriesManager({ initial }: { initial: Category[] }) {
  const [rows, setRows] = useState<Category[]>(initial);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);

  async function call(url: string, init: RequestInit, ok?: string) {
    setBusy(true);
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Алдаа гарлаа");
      setRows(json.categories);
      if (ok) toast.success(ok);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (await call("/api/admin/categories", { method: "POST", body: JSON.stringify({ name }) }, "Ангилал нэмэгдлээ")) setName("");
  };
  const patch = (id: number, body: Partial<Category>, ok?: string) =>
    call(`/api/admin/categories/${id}`, { method: "PATCH", body: JSON.stringify(body) }, ok);
  const remove = (c: Category) => {
    if (!confirm(`“${c.name}” ангиллыг устгах уу? Кинонууд устахгүй, зөвхөн энэ ангилалаас хасагдана.`)) return;
    call(`/api/admin/categories/${c.id}`, { method: "DELETE" }, "Устгагдлаа");
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const ids = rows.map((r) => r.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    call("/api/admin/categories", { method: "PUT", body: JSON.stringify({ order: ids }) });
  };
  const saveName = async () => {
    if (!editing) return;
    if (await patch(editing.id, { name: editing.name }, "Нэр хадгалагдлаа")) setEditing(null);
  };

  const input = "w-full rounded-xl bg-gray-900/80 border border-gray-700/80 px-4 py-3 text-base text-white placeholder:text-gray-500 outline-none focus:border-theme-primary";
  const mini = "rounded-lg bg-gray-800 border border-gray-700 px-2.5 py-1.5 text-sm text-gray-200 disabled:opacity-30 active:scale-95";

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <input className={input} value={name} maxLength={40} placeholder="Шинэ ангиллын нэр (жишээ: Хадмал)" onChange={(e) => setName(e.target.value)} />
        <button disabled={busy || !name.trim()} className="shrink-0 rounded-xl bg-theme-primary text-black font-bold px-5 disabled:opacity-50 active:scale-95">
          + Нэмэх
        </button>
      </form>

      {rows.length === 0 && <p className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 text-center text-gray-400">Ангилал алга. Дээрээс нэмнэ үү.</p>}

      {rows.map((c, i) => (
        <div key={c.id} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            {editing?.id === c.id ? (
              <>
                <input className={input} autoFocus maxLength={40} value={editing.name} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && saveName()} />
                <button onClick={saveName} disabled={busy} className={mini}>Хадгалах</button>
                <button onClick={() => setEditing(null)} className={mini}>✕</button>
              </>
            ) : (
              <>
                <h2 className="flex-1 min-w-0 truncate text-white font-semibold">{c.name}</h2>
                <button onClick={() => setEditing({ id: c.id, name: c.name })} className={mini}>Нэр засах</button>
                <button onClick={() => move(i, -1)} disabled={busy || i === 0} className={mini} aria-label="Дээш">↑</button>
                <button onClick={() => move(i, 1)} disabled={busy || i === rows.length - 1} className={mini} aria-label="Доош">↓</button>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" checked={c.show_on_home} disabled={busy} onChange={(e) => patch(c.id, { show_on_home: e.target.checked })} />
              Нүүр хуудсанд мөр болгон харуулах
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" checked={c.is_hero} disabled={busy} onChange={(e) => patch(c.id, { is_hero: e.target.checked })} />
              Том баннерт ашиглах
            </label>
            <button onClick={() => remove(c)} disabled={busy} className="ml-auto text-red-400 hover:text-red-300 disabled:opacity-50">Устгах</button>
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-500">Кинонд ангилал оноохдоо: Кинонууд → кино засах → “Ангилал” хэсэг.</p>
    </div>
  );
}
