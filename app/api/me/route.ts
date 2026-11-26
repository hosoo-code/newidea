import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Header-ийн нэвтрэлтийн төлвийг клиент талаас авна (Header статик хэвээр үлдэж, хуудас бүр хурдан ачаалагдана).
export async function GET() {
  const p = await getCurrentProfile().catch(() => null);
  return NextResponse.json(
    { loggedIn: !!p, isAdmin: p?.role === "admin" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
