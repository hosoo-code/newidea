import { NextRequest, NextResponse } from "next/server";

// TMDB түлхүүрийг серверт нууж, браузерт зөвхөн энэ proxy-оор хандуулна.
const BASE_URL = "https://api.themoviedb.org/3";
const ALLOWED = [
  /^trending\/(all|movie|tv)\/(day|week)$/,
  /^(movie|tv)\/(popular|top_rated|now_playing|upcoming|on_the_air|airing_today)$/,
  /^(movie|tv)\/\d+$/,
  /^tv\/\d+\/season\/\d+(\/episode\/\d+)?$/,
  /^genre\/(movie|tv)\/list$/,
  /^discover\/(movie|tv)$/,
  /^search\/(multi|movie|tv)$/,
];

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const joined = path.join("/");
  if (!ALLOWED.some((r) => r.test(joined))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const token = process.env.TMDB_ACCESS_TOKEN;
  const apiKey = process.env.API_KEY;
  if (!token && !apiKey) {
    return NextResponse.json({ error: "TMDB тохируулаагүй байна" }, { status: 500 });
  }

  const qs = new URLSearchParams(req.nextUrl.searchParams);
  qs.delete("api_key");
  if (!token && apiKey) qs.set("api_key", apiKey);

  const res = await fetch(`${BASE_URL}/${joined}?${qs}`, {
    headers: { accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    next: { revalidate: 1800 },
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
