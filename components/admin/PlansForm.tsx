"use client";
import { useState } from "react";
import { toast } from "sonner";

type Row = { id: string; label: string; days: number; amount: number; active: boolean };
const TITLES: Record<string, string> = { month: "Сарын эрх", quarter: "Улирлын эрх", half: "Хагас жилийн эрх", year: "Жилийн эрх" };

export default function PlansForm({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [saving, setSaving] = useState(false);

  const set = (id: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: rows }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Алдаа гарлаа");
      setRows(json.plans);
      toast.success("Хадгаллаа");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white text-base focus:border-theme-primary outline-none";

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.id} className={`glass-container space-y-3 ${r.active ? "" : "opacity-60"}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-white font-semibold">{TITLES[r.id] ?? r.id}</h2>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={r.active} onChange={(e) => set(r.id, { active: e.target.checked })} className="h-4 w-4" />
              Идэвхтэй
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="filter-label-sm">Нэр</span>
              <input className={input} value={r.label} maxLength={40} onChange={(e) => set(r.id, { label: e.target.value })} />
            </label>
            <label className="space-y-1">
              <span className="filter-label-sm">Хоног</span>
              <input className={input} type="number" inputMode="numeric" min={1} value={r.days || ""} onChange={(e) => set(r.id, { days: Number(e.target.value) })} />
            </label>
            <label className="space-y-1">
              <span className="filter-label-sm">Үнэ (₮)</span>
              <input className={input} type="number" inputMode="numeric" min={100} value={r.amount || ""} onChange={(e) => set(r.id, { amount: Number(e.target.value) })} />
            </label>
          </div>
        </div>
      ))}
      <button onClick={save} disabled={saving} className="w-full sm:w-auto rounded-lg bg-theme-primary text-black font-semibold px-6 py-2.5 disabled:opacity-50">
        {saving ? "Хадгалж байна..." : "Хадгалах"}
      </button>
      <p className="text-xs text-gray-400">Өөрчлөлт шинэ төлбөрөөс хүчинтэй болно. Өмнө үүссэн (төлөгдөөгүй) төлбөр хуучин үнэ, хоногоороо баталгаажна.</p>
    </div>
  );
}
