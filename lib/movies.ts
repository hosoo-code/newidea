import { supabasePublic, supabaseAdmin } from "./supabase";

export interface LocalMovie {
  id: number;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  release_year: number | null;
  rating: number | null;
  runtime: number | null;
  genres: string[] | null;
  video_url: string | null;
  tmdb_id: number | null;
  published: boolean;
  created_at: string;
}

export async function getLocalMovies(limit?: number): Promise<LocalMovie[]> {
  try {
    let q = supabasePublic()
      .from("movies")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data as LocalMovie[]) ?? [];
  } catch (e) {
    console.error("[movies] getLocalMovies failed:", e);
    return [];
  }
}

export async function getLocalMoviesPage(
  page = 1,
  pageSize = 24
): Promise<{ movies: LocalMovie[]; total: number }> {
  try {
    const from = (Math.max(1, page) - 1) * pageSize;
    const { data, error, count } = await supabasePublic()
      .from("movies")
      .select("*", { count: "exact" })
      .eq("published", true)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    return { movies: (data as LocalMovie[]) ?? [], total: count ?? 0 };
  } catch (e) {
    console.error("[movies] getLocalMoviesPage failed:", e);
    return { movies: [], total: 0 };
  }
}

export async function getLocalMovie(id: number): Promise<LocalMovie | null> {
  try {
    const { data, error } = await supabasePublic()
      .from("movies")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    return (data as LocalMovie) ?? null;
  } catch (e) {
    console.error("[movies] getLocalMovie failed:", e);
    return null;
  }
}

// Admin: draft-уудыг оролцуулан бүгдийг авна
export async function adminListMovies(): Promise<LocalMovie[]> {
  const { data, error } = await supabaseAdmin()
    .from("movies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as LocalMovie[]) ?? [];
}

export async function adminGetMovie(id: number): Promise<LocalMovie | null> {
  const { data, error } = await supabaseAdmin()
    .from("movies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as LocalMovie) ?? null;
}

// API-аар ирсэн өгөгдлийг цэвэрлэж зөвхөн зөвшөөрөгдсөн талбар үлдээнэ
export function sanitizeMovieInput(body: Record<string, unknown>) {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const num = (v: unknown) => {
    const n = Number(v);
    return v === "" || v == null || Number.isNaN(n) ? null : n;
  };
  const httpsUrl = (v: unknown, label: string) => {
    const u = str(v);
    if (!u) return null;
    try {
      if (new URL(u).protocol !== "https:") throw new Error();
    } catch {
      throw new Error(`${label}: зөвхөн https:// холбоос зөвшөөрнө`);
    }
    return u;
  };
  const title = str(body.title);
  if (!title) throw new Error("Киноны нэр шаардлагатай");
  const genres = Array.isArray(body.genres)
    ? (body.genres as unknown[]).map((g) => String(g).trim()).filter(Boolean)
    : typeof body.genres === "string"
    ? body.genres.split(",").map((g) => g.trim()).filter(Boolean)
    : [];
  return {
    title,
    original_title: str(body.original_title),
    overview: str(body.overview),
    poster_url: httpsUrl(body.poster_url, "Poster"),
    backdrop_url: httpsUrl(body.backdrop_url, "Backdrop"),
    release_year: num(body.release_year),
    rating: num(body.rating) ?? 0,
    runtime: num(body.runtime),
    genres,
    video_url: httpsUrl(body.video_url, "Видео"),
    tmdb_id: num(body.tmdb_id),
    published: body.published !== false,
  };
}
