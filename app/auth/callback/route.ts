import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Имэйл баталгаажуулах холбоосоос ирэх code-г session болгон солино
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const n = req.nextUrl.searchParams.get("next") ?? "/";
  const next = n.startsWith("/") && !n.startsWith("//") ? n : "/";
  if (code) {
    const sb = await supabaseServer();
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next, req.url));
}
