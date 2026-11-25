"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LocalMovie } from "@/lib/movies";

type FormState = {
  title: string;
  original_title: string;
  overview: string;
  poster_url: string;
  backdrop_url: string;
  release_year: string;
  rating: string;
  runtime: string;
  genres: string;
  video_url: string;
  tmdb_id: string;
  published: boolean;
};

const empty: FormState = {
  title: "", original_title: "", overview: "", poster_url: "", backdrop_url: "",
  release_year: "", rating: "", runtime: "", genres: "", video_url: "", tmdb_id: "",
  published: true,
};

const field =
  "w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white outline-none focus:border-theme-primary";

export default function MovieForm({ movie }: { movie?: LocalMovie }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(
    movie
      ? {
          title: movie.title,
          original_title: movie.original_title ?? "",
          overview: movie.overview ?? "",
          poster_url: movie.poster_url ?? "",
          backdrop_url: movie.backdrop_url ?? "",
          release_year: movie.release_year?.toString() ?? "",
          rating: movie.rating?.toString() ?? "",
          runtime: movie.runtime?.toString() ?? "",
          genres: (movie.genres ?? []).join(", "),
          video_url: movie.video_url ?? "",
          tmdb_id: movie.tmdb_id?.toString() ?? "",
          published: movie.published,
        }
      : empty
  );
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const set = (k: keyof FormState, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  async function fillFromTmdb() {
    if (!f.tmdb_id) return toast.error("TMDB ID оруулна уу");
    setBusy("tmdb");
    const res = await fetch(`/api/admin/tmdb?id=${encodeURIComponent(f.tmdb_id)}`);
    const json = await res.json();
    setBusy(null);
    if (!res.ok) return toast.error(json.error ?? "Алдаа");
    setF((p) => ({
      ...p,
      title: json.title ?? p.title,
      original_title: json.original_title ?? "",
      overview: json.overview ?? "",
      poster_url: json.poster_url ?? "",
      backdrop_url: json.backdrop_url ?? "",
      release_year: String(json.release_year ?? ""),
      rating: String(json.rating ?? ""),
      runtime: String(json.runtime ?? ""),
      genres: (json.genres ?? []).join(", "),
    }));
    toast.success("TMDB-ээс бөглөлөө");
  }

  async function upload(file: File, key: "poster_url" | "backdrop_url") {
    setBusy(key);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) return toast.error(json.error ?? "Upload амжилтгүй");
    set(key, json.url);
  }

  async function uploadVideo(file: File) {
    const res = await fetch("/api/admin/r2-presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error ?? "Алдаа гарлаа");

    setProgress(0);
    const ok = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", json.uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
      xhr.onerror = () => resolve(false);
      xhr.send(file);
    });
    setProgress(null);
    if (!ok) return toast.error("R2 руу upload амжилтгүй (bucket CORS-ийг шалгана уу)");
    set("video_url", json.publicUrl);
    toast.success("Видео R2 руу орлоо – “Хадгалах” дарна уу");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(movie ? `/api/admin/movies/${movie.id}` : "/api/admin/movies", {
      method: movie ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setSaving(false);
    if (!res.ok) return toast.error((await res.json()).error ?? "Алдаа гарлаа");
    toast.success(movie ? "Хадгалагдлаа" : "Кино нэмэгдлээ");
    router.push("/admin");
    router.refresh();
  }

  const label = "block text-sm text-gray-300 mb-1";

  return (
    <form onSubmit={submit} className="space-y-5 max-w-3xl">
      {/* TMDB autofill */}
      <div className="glass-container p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className={label}>TMDB ID (заавал биш – автоматаар бөглөнө)</label>
          <input className={field} value={f.tmdb_id} onChange={(e) => set("tmdb_id", e.target.value)} inputMode="numeric" />
        </div>
        <button type="button" onClick={fillFromTmdb} disabled={busy === "tmdb"} className="rounded-lg bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 disabled:opacity-50">
          {busy === "tmdb" ? "..." : "Бөглөх"}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Нэр *</label>
          <input required className={field} value={f.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label className={label}>Эх нэр</label>
          <input className={field} value={f.original_title} onChange={(e) => set("original_title", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={label}>Тайлбар</label>
        <textarea rows={4} className={field} value={f.overview} onChange={(e) => set("overview", e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div>
          <label className={label}>Он</label>
          <input className={field} inputMode="numeric" value={f.release_year} onChange={(e) => set("release_year", e.target.value)} />
        </div>
        <div>
          <label className={label}>Үнэлгээ (0–10)</label>
          <input className={field} inputMode="decimal" value={f.rating} onChange={(e) => set("rating", e.target.value)} />
        </div>
        <div>
          <label className={label}>Хугацаа (мин)</label>
          <input className={field} inputMode="numeric" value={f.runtime} onChange={(e) => set("runtime", e.target.value)} />
        </div>
        <div>
          <label className={label}>Төрөл (таслалаар)</label>
          <input className={field} placeholder="Action, Drama" value={f.genres} onChange={(e) => set("genres", e.target.value)} />
        </div>
      </div>

      {(["poster_url", "backdrop_url"] as const).map((k) => (
        <div key={k}>
          <label className={label}>{k === "poster_url" ? "Poster" : "Backdrop"} (URL эсвэл upload)</label>
          <div className="flex gap-3 items-start">
            <input className={field} value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder="https://..." />
            <label className="shrink-0 cursor-pointer rounded-lg bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 text-sm">
              {busy === k ? "..." : "Upload"}
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], k)} />
            </label>
          </div>
          {f[k] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f[k]} alt="" className={`mt-2 rounded-lg object-cover ${k === "poster_url" ? "h-40" : "h-28"}`} />
          )}
        </div>
      ))}

      <div>
        <label className={label}>Видео (R2 руу upload хийх, эсвэл линк буулгах)</label>
        <div className="flex gap-3 items-start">
          <input className={field} value={f.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://... (.mp4 / .m3u8 / embed)" />
          <label className="shrink-0 cursor-pointer rounded-lg bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 text-sm">
            {progress !== null ? `${progress}%` : "Upload MP4"}
            <input type="file" accept="video/mp4,video/webm" hidden disabled={progress !== null} onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
          </label>
        </div>
        {progress !== null && (
          <div className="mt-2 h-2 rounded bg-gray-800 overflow-hidden">
            <div className="h-full bg-theme-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-gray-200">
        <input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} />
        Нийтлэх (унтраавал зөвхөн draft болно)
      </label>

      <div className="flex gap-3">
        <button disabled={saving || progress !== null} className="rounded-lg bg-theme-primary text-black font-semibold px-6 py-2 disabled:opacity-50">
          {saving ? "Хадгалж байна..." : movie ? "Хадгалах" : "Нэмэх"}
        </button>
        <button type="button" onClick={() => router.push("/admin")} className="rounded-lg bg-gray-800 text-white px-6 py-2">
          Болих
        </button>
      </div>
    </form>
  );
}
