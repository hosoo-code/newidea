import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";
import { TMDBMovieDetail } from "@/lib/types";

export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "TMDB ID буруу" }, { status: 400 });
  }
  try {
    const m = (await api.getDetails("movie", id)) as TMDBMovieDetail;
    return NextResponse.json({
      title: m.title,
      original_title: m.original_title,
      overview: m.overview,
      poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "",
      backdrop_url: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : "",
      release_year: m.release_date ? Number(m.release_date.slice(0, 4)) : "",
      rating: Math.round(m.vote_average * 10) / 10,
      runtime: m.runtime ?? "",
      genres: m.genres?.map((g) => g.name) ?? [],
      tmdb_id: m.id,
    });
  } catch {
    return NextResponse.json({ error: "TMDB-ээс кино олдсонгүй" }, { status: 404 });
  }
}
