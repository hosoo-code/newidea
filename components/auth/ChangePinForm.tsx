"use client";
import { useState } from "react";
import { toast } from "sonner";

const field =
  "w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white text-center tracking-[0.5em] outline-none focus:border-theme-primary";

export default function ChangePinForm() {
  const [oldPin, setOld] = useState("");
  const [newPin, setNew] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 4);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPin !== again) return toast.error("Шинэ PIN хоёр таарахгүй байна");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPin, newPin }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Алдаа гарлаа");
      toast.success("PIN код амжилттай солигдлоо");
      setOld("");
      setNew("");
      setAgain("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 sm:p-5">
      <summary className="cursor-pointer font-semibold text-white">PIN код солих</summary>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input type="password" inputMode="numeric" autoComplete="current-password" placeholder="Хуучин PIN" value={oldPin} onChange={(e) => setOld(digits(e.target.value))} className={field} />
        <input type="password" inputMode="numeric" autoComplete="new-password" placeholder="Шинэ PIN" value={newPin} onChange={(e) => setNew(digits(e.target.value))} className={field} />
        <input type="password" inputMode="numeric" autoComplete="new-password" placeholder="Шинэ PIN давтах" value={again} onChange={(e) => setAgain(digits(e.target.value))} className={field} />
        <button
          disabled={busy || oldPin.length !== 4 || newPin.length !== 4 || again.length !== 4}
          className="w-full rounded-lg bg-theme-primary py-2 font-semibold text-black disabled:opacity-50"
        >
          {busy ? "..." : "PIN солих"}
        </button>
        <p className="text-xs text-gray-400">Солисны дараа бусад төхөөрөмж дээрх нэвтрэлт автоматаар гарна.</p>
      </form>
    </details>
  );
}
