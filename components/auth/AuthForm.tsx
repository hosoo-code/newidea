"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { normalizePhone, phoneToEmail } from "@/lib/phone";

export default function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
    if (!p) {
      toast.error("Утасны дугаар буруу байна (8 оронтой, жишээ: 99112233)");
      return;
    }
    const email = phoneToEmail(p);
    setLoading(true);
    const sb = supabaseBrowser();
    try {
      if (mode === "in") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message === "Invalid login credentials" ? "Дугаар эсвэл нууц үг буруу байна" : error.message);
        router.push(next);
        router.refresh();
      } else {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw new Error(/already registered/i.test(error.message) ? "Энэ дугаар бүртгэлтэй байна. Нэвтэрнэ үү" : error.message);
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          // Supabase дээр "Confirm email" асаалттай байвал session ирэхгүй
          toast.error("Бүртгэл үүссэн ч нэвтэрсэнгүй. Supabase → Auth → Providers → Email → 'Confirm email'-ийг унтраана уу.");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-container p-6 w-full max-w-sm space-y-4">
      <h1 className="text-xl font-bold text-white">{mode === "in" ? "Нэвтрэх" : "Бүртгүүлэх"}</h1>
      <button
        type="button"
        onClick={google}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 rounded-lg bg-white text-gray-800 font-semibold py-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.3 5.7c4.3-4 6.8-9.9 6.8-17.1z" />
          <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.9 2.3-8.6 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        Google-ээр нэвтрэх
      </button>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="h-px flex-1 bg-gray-700" /> эсвэл <span className="h-px flex-1 bg-gray-700" />
      </div>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Утасны дугаар (99112233)"
        autoFocus
        className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white outline-none focus:border-theme-primary"
      />
      <input
        type="password"
        autoComplete={mode === "in" ? "current-password" : "new-password"}
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Нууц үг"
        className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white outline-none focus:border-theme-primary"
      />
      <button
        disabled={loading || !phone || !password}
        className="w-full rounded-lg bg-theme-primary text-black font-semibold py-2 disabled:opacity-50"
      >
        {loading ? "..." : mode === "in" ? "Нэвтрэх" : "Бүртгүүлэх"}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="w-full text-sm text-gray-400 hover:text-white"
      >
        {mode === "in" ? "Бүртгэлгүй юу? Бүртгүүлэх" : "Бүртгэлтэй юу? Нэвтрэх"}
      </button>
    </form>
  );
}
