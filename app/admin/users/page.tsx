import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import UsersManager, { type UserRow } from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Хэрэглэгчид | Kino Mangas", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireAdmin();
  const { q: raw } = await searchParams;
  const q = (raw ?? "").trim().slice(0, 80);

  let query = supabaseAdmin()
    .from("profiles")
    .select("id,email,role,premium_until,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50);
  if (q) {
    if (UUID.test(q)) query = query.eq("id", q);
    else query = query.ilike("email", `%${q.replace(/[%_\\,()]/g, "")}%`); // утасны дугаар / имэйлээр хайна
  }
  const { data, count, error } = await query;

  return (
    <div className="app-bg-enhanced min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Хэрэглэгчид</h1>
            <p className="text-sm text-gray-400">Нийт {count ?? 0}{q && ` · "${q}" хайлт`}</p>
          </div>
          <Link href="/admin" className="text-sm text-gray-300 hover:text-white">← Кинонууд</Link>
        </div>

        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Утасны дугаар эсвэл ID"
            className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-white outline-none focus:border-theme-primary"
          />
          <button className="rounded-xl bg-theme-primary px-5 font-semibold text-black">Хайх</button>
        </form>

        {error && <p className="text-red-400">{error.message}</p>}
        <UsersManager users={(data ?? []) as UserRow[]} meId={me?.id ?? ""} />
      </div>
    </div>
  );
}
