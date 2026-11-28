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

// Бүх кино төрөл (TMDB-тэй ижил нэртэй тул "Бөглөх" товч автоматаар сонгоно)
const ALL_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy",
  "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Thriller", "TV Movie", "War", "Western",
];

const field =
  "w-full rounded-xl bg-gray-900/80 border border-gray-700/80 px-4 py-3 text-base text-white placeholder:text-gray-500 outline-none transition-colors focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20";
const card = "rounded-2xl border border-gray-800 bg-gray-900/40 p-4 sm:p-6 space-y-4";
const secTitle = "text-xs font-semibold uppercase tracking-wider text-theme-primary";
const ghostBtn =
  "inline-flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-700 text-white px-4 py-3 text-sm font-medium transition-all";

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

  const selectedGenres = f.genres.split(",").map((g) => g.trim()).filter(Boolean);
  // Жагсаалтад байхгүй (өмнө гараар бичсэн) төрлийг ч сонголт болгож харуулна
  const genreChoices = [...ALL_GENRES, ...selectedGenres.filter((g) => !ALL_GENRES.includes(g))];
  const toggleGenre = (g: string) =>
    set("genres", (selectedGenres.includes(g) ? selectedGenres.filter((x) => x !== g) : [...selectedGenres, g]).join(", "));

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
    body.append("kind", key === "backdrop_url" ? "backdrop" : "poster");
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
    // 0 = сүлжээ/CORS-ээр хаагдсан, бусад нь R2-ийн HTTP статус
    const status = await new Promise<number>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", json.uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => resolve(xhr.status);
      xhr.onerror = () => resolve(0);
      xhr.send(file);
    });
    setProgress(null);
    if (status < 200 || status >= 300) {
      return toast.error(
        status === 0
          ? "R2 руу холбогдож чадсангүй (bucket CORS эсвэл сүлжээг шалгана уу)"
          : `R2 руу upload амжилтгүй (HTTP ${status}). Token-ий эрх, bucket-ийн нэрийг шалгана уу`
      );
    }
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

  const label = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <form onSubmit={submit} className="space-y-5 max-w-3xl pb-28">
      {/* 1. TMDB автоматаар бөглөх */}
      <section className={card}>
        <h2 className={secTitle}>⚡ Хурдан бөглөх</h2>
        <div>
          <label className={label}>TMDB ID <span className="text-gray-500 font-normal">(заавал биш)</span></label>
          <div className="flex gap-3">
            <input className={field} value={f.tmdb_id} onChange={(e) => set("tmdb_id", e.target.value)} inputMode="numeric" placeholder="жишээ: 550" />
            <button type="button" onClick={fillFromTmdb} disabled={busy === "tmdb"} className={`${ghostBtn} shrink-0 disabled:opacity-50`}>
              {busy === "tmdb" ? "..." : "Бөглөх"}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Үндсэн мэдээлэл */}
      <section className={card}>
        <h2 className={secTitle}>Үндсэн мэдээлэл</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Нэр <span className="text-red-400">*</span></label>
            <input required className={field} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Киноны нэр" />
          </div>
          <div>
            <label className={label}>Эх нэр <span className="text-gray-500 font-normal">(заавал биш)</span></label>
            <input className={field} value={f.original_title} onChange={(e) => set("original_title", e.target.value)} placeholder="Анхны хэл дээрх нэр" />
          </div>
        </div>
        <div>
          <label className={label}>Тайлбар</label>
          <textarea rows={4} className={`${field} resize-y`} value={f.overview} onChange={(e) => set("overview", e.target.value)} placeholder="Киноны товч агуулга..." />
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className={label}>Он</label>
            <input className={field} inputMode="numeric" value={f.release_year} onChange={(e) => set("release_year", e.target.value)} placeholder="2024" />
          </div>
          <div>
            <label className={label}>Үнэлгээ</label>
            <input className={field} inputMode="decimal" value={f.rating} onChange={(e) => set("rating", e.target.value)} placeholder="0–10" />
          </div>
          <div>
            <label className={label}>Минут</label>
            <input className={field} inputMode="numeric" value={f.runtime} onChange={(e) => set("runtime", e.target.value)} placeholder="120" />
          </div>
        </div>
      </section>

      {/* 3. Төрөл */}
      <section className={card}>
        <div className="flex items-center justify-between">
          <h2 className={secTitle}>Төрөл</h2>
          <span className="text-xs text-gray-400">{selectedGenres.length > 0 ? `${selectedGenres.length} сонгосон` : "олныг сонгож болно"}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {genreChoices.map((g) => {
            const on = selectedGenres.includes(g);
            return (
              <button
                key={g}
                type="button"
                aria-pressed={on}
                onClick={() => toggleGenre(g)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-all active:scale-95 ${
                  on
                    ? "border-theme-primary bg-theme-primary text-black font-semibold shadow-[0_0_12px_rgba(253,228,2,0.25)]"
                    : "border-gray-700 bg-gray-900/80 text-gray-300 hover:border-gray-500 hover:text-white"
                }`}
              >
                {on && "✓ "}
                {g}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Зураг */}
      <section className={card}>
        <h2 className={secTitle}>Зураг</h2>
        <div className="grid gap-5 sm:grid-cols-[1fr_1.6fr]">
          {(["poster_url", "backdrop_url"] as const).map((k) => {
            const isPoster = k === "poster_url";
            return (
              <div key={k} className="space-y-2">
                <label className={label}>{isPoster ? "Poster" : "Backdrop"}</label>
                <div
                  className={`relative overflow-hidden rounded-xl border border-dashed border-gray-700 bg-gray-950/60 ${
                    isPoster ? "aspect-[2/3] max-w-[180px]" : "aspect-video"
                  }`}
                >
                  {f[k] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f[k]} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">Зураг алга</div>
                  )}
                  {busy === k && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">Upload...</div>
                  )}
                </div>
                <input className={field} value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder="https://... линк" />
                <label className={`${ghostBtn} w-full cursor-pointer`}>
                  📷 Зураг upload хийх
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], k)} />
                </label>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Видео */}
      <section className={card}>
        <h2 className={secTitle}>Видео</h2>
        <div className="space-y-3">
          <input className={field} value={f.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://... (.mp4 / .m3u8 / embed)" />
          <label className={`${ghostBtn} w-full cursor-pointer ${progress !== null ? "opacity-60 pointer-events-none" : ""}`}>
            {progress !== null ? `Upload хийж байна… ${progress}%` : "🎬 MP4 файл R2 руу upload хийх"}
            <input type="file" accept="video/mp4,video/webm" hidden disabled={progress !== null} onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
          </label>
          {progress !== null && (
            <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full bg-theme-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {f.video_url && progress === null && (
            <p className="text-xs text-green-400 truncate">✓ Видео холбогдсон: {f.video_url}</p>
          )}
        </div>
      </section>

      {/* 6. Нийтлэх (toggle) */}
      <section className={`${card} !space-y-0`}>
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span>
            <span className="block text-white font-medium">Нийтлэх</span>
            <span className="block text-xs text-gray-400">Унтраавал зөвхөн draft болж, үзэгчдэд харагдахгүй</span>
          </span>
          <span className="relative shrink-0">
            <input type="checkbox" className="peer sr-only" checked={f.published} onChange={(e) => set("published", e.target.checked)} />
            <span className="block h-7 w-12 rounded-full bg-gray-700 transition-colors peer-checked:bg-theme-primary" />
            <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </section>

      {/* Үйлдлийн мөр – гар утсан дээр доор нь тогтнож харагдана */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-800 bg-black/85 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-3xl gap-3">
          <button type="button" onClick={() => router.push("/admin")} className={`${ghostBtn} flex-1 sm:flex-none sm:px-6`}>
            Болих
          </button>
          <button
            disabled={saving || progress !== null}
            className="flex-[2] sm:flex-none sm:px-10 rounded-xl bg-theme-primary text-black font-bold py-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Хадгалж байна..." : movie ? "Хадгалах" : "Нэмэх"}
          </button>
        </div>
      </div>
    </form>
  );
}
