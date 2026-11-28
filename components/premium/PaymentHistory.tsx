import { supabaseServer } from "@/lib/supabaseServer";
import { getPlans } from "@/lib/plans";

type Row = {
  id: string;
  plan: string;
  amount: number;
  status: "pending" | "succeeded" | "failed" | "canceled";
  days: number | null;
  created_at: string;
  paid_at: string | null;
  movie?: { title: string } | { title: string }[] | null;
};

const dt = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(",", "");

function badge(r: Row): { text: string; cls: string } {
  if (r.status === "succeeded") return { text: "Амжилттай", cls: "bg-green-500/15 text-green-400" };
  if (r.status === "pending") {
    const stale = Date.now() - new Date(r.created_at).getTime() > 30 * 60 * 1000;
    return stale
      ? { text: "Хугацаа дууссан", cls: "bg-gray-700/60 text-gray-300" }
      : { text: "Хүлээгдэж байна", cls: "bg-yellow-400/15 text-yellow-300" };
  }
  if (r.status === "canceled") return { text: "Цуцлагдсан", cls: "bg-gray-700/60 text-gray-300" };
  return { text: "Амжилтгүй", cls: "bg-red-500/15 text-red-400" };
}

// Нэвтэрсэн хэрэглэгчийн өөрийн төлбөрүүд (RLS: "payments read own")
export default async function PaymentHistory() {
  const sb = await supabaseServer();
  const [{ data }, plans] = await Promise.all([
    sb
      .from("payments")
      .select("id,plan,amount,status,days,created_at,paid_at,movie:movies(title)")
      .eq("status", "succeeded") // зөвхөн амжилттай төлбөрийг харуулна
      .order("created_at", { ascending: false })
      .limit(20),
    getPlans({ includeInactive: true }),
  ]);
  const rows = (data ?? []) as Row[];
  const label = (r: Row) => {
    if (r.plan === "movie") {
      const m = Array.isArray(r.movie) ? r.movie[0] : r.movie;
      return `Кино · ${m?.title ?? "худалдан авалт"}`;
    }
    return `Premium · ${plans.find((p) => p.id === r.plan)?.label ?? r.plan}`;
  };

  return (
    <section aria-label="Төлбөрийн түүх" className="space-y-3">
      <h2 className="text-lg font-bold text-white">Төлбөрийн түүх</h2>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 text-center text-sm text-gray-400">
          Амжилттай төлбөр байхгүй байна.
        </p>
      ) : (
        <ul className="divide-y divide-gray-800 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50">
          {rows.map((r) => {
            const b = badge(r);
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-white">{label(r)}</p>
                  <p className="text-xs text-gray-400">
                    {dt(r.paid_at ?? r.created_at)}
                    {r.status === "succeeded" && r.days && r.plan !== "movie" ? ` · +${r.days} хоног` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-white">{Number(r.amount).toLocaleString("en-US")}₮</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.cls}`}>{b.text}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
