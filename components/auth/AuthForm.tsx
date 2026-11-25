"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const sb = supabaseBrowser();
    try {
      if (mode === "in") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          toast.success("Имэйлээ шалгаад баталгаажуулах холбоос дээр дарна уу");
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
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Имэйл"
        autoFocus
        className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white outline-none focus:border-theme-primary"
      />
      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Нууц үг"
        className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white outline-none focus:border-theme-primary"
      />
      <button
        disabled={loading || !email || !password}
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
