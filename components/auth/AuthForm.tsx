"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { normalizePhone } from "@/lib/phone";
import PinInput from "./PinInput";

export default function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(false);
  const pinWrap = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function google() {
    setLoading(true);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } // амжилттай бол Google руу шилжинэ
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (!p) return toast.error("Утасны дугаар буруу байна (8 оронтой, жишээ: 99112233)");
    if (!/^\d{4}$/.test(pin)) return toast.error("PIN код 4 оронтой тоо байна");
    if (mode === "up" && pin !== pin2) return toast.error("PIN код хоёр таарахгүй байна");
    setLoading(true);
    try {
      const res = await fetch(mode === "in" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p, pin }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Алдаа гарлаа");
      router.push(next);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  const mismatch = mode === "up" && pin2.length === 4 && pin !== pin2;
  const ready = !!phone && pin.length === 4 && (mode === "in" || pin2.length === 4);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Kino Mangas" className="h-24 w-auto drop-shadow-[0_0_24px_rgba(250,204,21,0.25)]" />
        <h1 className="mt-3 text-2xl font-extrabold text-white">{mode === "in" ? "Тавтай морил" : "Бүртгэл үүсгэх"}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {mode === "in" ? "Дугаар болон 4 оронтой PIN кодоо оруулна уу" : "Дугаараа оруулаад 4 оронтой PIN код зохио"}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-gray-900/60 p-5 shadow-2xl backdrop-blur-md sm:p-6">
        {/* Нэвтрэх / Бүртгүүлэх */}
        <div className="mb-5 grid grid-cols-2 rounded-xl bg-black/40 p-1" role="tablist">
          {(["in", "up"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setPin("");
                setPin2("");
              }}
              className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === m ? "bg-theme-primary text-black shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              {m === "in" ? "Нэвтрэх" : "Бүртгүүлэх"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-300">
              Утасны дугаар
            </label>
            <div className="flex overflow-hidden rounded-xl border border-gray-700 bg-gray-900/80 transition-all focus-within:border-theme-primary focus-within:ring-2 focus-within:ring-theme-primary/30">
              <span className="flex items-center border-r border-gray-700 bg-black/30 px-3 text-sm font-semibold text-gray-300">🇲🇳 +976</span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                required
                maxLength={12}
                value={phone}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d\s+]/g, "");
                  setPhone(v);
                  if (v.replace(/\D/g, "").length === 8) pinWrap.current?.querySelector("input")?.focus();
                }}
                placeholder="9911 2233"
                className="h-14 w-full bg-transparent px-4 text-lg tracking-wide text-white outline-none placeholder:text-gray-600"
              />
            </div>
          </div>

          <div ref={pinWrap} className="space-y-4">
            <PinInput
              label={mode === "in" ? "PIN код" : "PIN код зохио"}
              value={pin}
              onChange={setPin}
              reveal={reveal}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
            />
            {mode === "up" && (
              <PinInput label="PIN код давтах" value={pin2} onChange={setPin2} reveal={reveal} invalid={mismatch} autoComplete="new-password" />
            )}
            {mismatch && <p className="text-xs text-red-400">PIN код хоёр таарахгүй байна</p>}
            <button type="button" onClick={() => setReveal((v) => !v)} className="text-xs text-gray-400 hover:text-white">
              {reveal ? "🙈 PIN нуух" : "👁 PIN харуулах"}
            </button>
          </div>

          <button
            disabled={loading || !ready || mismatch}
            className="h-14 w-full rounded-xl bg-theme-primary text-base font-bold text-black shadow-lg shadow-yellow-500/10 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? "Түр хүлээнэ үү..." : mode === "in" ? "Нэвтрэх" : "Бүртгүүлэх"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-gray-500">
          <span className="h-px flex-1 bg-gray-700" /> эсвэл <span className="h-px flex-1 bg-gray-700" />
        </div>

        <button
          type="button"
          onClick={google}
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white font-semibold text-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.3 5.7c4.3-4 6.8-9.9 6.8-17.1z" />
            <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.9 2.3-8.6 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
          </svg>
          Google-ээр үргэлжлүүлэх
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">PIN кодоо хэнд ч бүү хэлээрэй.</p>
    </div>
  );
}
