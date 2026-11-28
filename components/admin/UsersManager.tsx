"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate, daysLeft } from "@/lib/format";
import { displayIdentity } from "@/lib/phone";

export interface UserRow {
  id: string;
  email: string | null;
  role: "user" | "admin";
  premium_until: string | null;
  created_at: string;
}

function UserCard({ u, meId }: { u: UserRow; meId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState("");
  const isMe = u.id === meId;
  const active = !!u.premium_until && new Date(u.premium_until) > new Date();

  async function act(body: Record<string, unknown>, ok: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, ...body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Алдаа гарлаа");
      toast.success(ok);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  const chip = "rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white active:scale-95 disabled:opacity-50";

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">
            {displayIdentity(u.email)} {isMe && <span className="text-xs text-gray-400">(та)</span>}
          </p>
          <p className="text-xs text-gray-500 break-all">{u.id}</p>
          <p className="text-xs text-gray-400">Бүртгүүлсэн: {formatDate(u.created_at)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {u.role === "admin" && <span className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-[11px] font-bold text-yellow-300">ADMIN</span>}
          {active ? (
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold text-green-400">
              Premium · {daysLeft(u.premium_until!)} хоног
            </span>
          ) : (
            <span className="rounded-full bg-gray-700/60 px-2 py-0.5 text-[11px] text-gray-300">Premium эрхгүй</span>
          )}
        </div>
      </div>

      {u.premium_until && (
        <p className="text-xs text-gray-400">
          {active ? "Дуусах огноо" : "Дууссан"}: {formatDate(u.premium_until)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {[30, 90, 365].map((d) => (
          <button key={d} disabled={busy} className={chip} onClick={() => act({ action: "grant_premium", days: d }, `+${d} хоног Premium олголоо`)}>
            +{d} хоног
          </button>
        ))}
        <input
          inputMode="numeric"
          value={days}
          onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
          placeholder="хоног"
          className="w-20 rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white"
        />
        <button
          disabled={busy || !days}
          className={chip}
          onClick={() => act({ action: "grant_premium", days: Number(days) }, `+${days} хоног Premium олголоо`).then(() => setDays(""))}
        >
          Олгох
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {active && (
          <button
            disabled={busy}
            className={`${chip} !border-red-500/40 text-red-300`}
            onClick={() => confirm("Premium эрхийг цуцлах уу?") && act({ action: "revoke_premium" }, "Premium цуцаллаа")}
          >
            Premium цуцлах
          </button>
        )}
        {u.role === "user" ? (
          <button
            disabled={busy}
            className={`${chip} !border-yellow-400/40 text-yellow-300`}
            onClick={() => confirm("Энэ хэрэглэгчийг ADMIN болгох уу? Бүх киног удирдах эрхтэй болно.") && act({ action: "set_role", role: "admin" }, "Admin болголоо")}
          >
            Admin болгох
          </button>
        ) : (
          !isMe && (
            <button
              disabled={busy}
              className={chip}
              onClick={() => confirm("Admin эрхийг хасах уу?") && act({ action: "set_role", role: "user" }, "Admin эрхийг хаслаа")}
            >
              Admin эрх хасах
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function UsersManager({ users, meId }: { users: UserRow[]; meId: string }) {
  if (users.length === 0) return <p className="rounded-2xl border border-gray-800 bg-gray-900/40 p-8 text-center text-gray-400">Хэрэглэгч олдсонгүй.</p>;
  return (
    <div className="space-y-3">
      {users.map((u) => (
        <UserCard key={u.id} u={u} meId={meId} />
      ))}
    </div>
  );
}
