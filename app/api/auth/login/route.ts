import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { normalizePhone, phoneToEmail } from "@/lib/phone";
import { isPin, pinPassword } from "@/lib/pin";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { AUTH_LIMITS as L, waitText } from "@/lib/authLimits";

// 4 оронтой PIN нь 10,000 хувилбартай тул brute-force-оос сэргийлж дугаар болон IP тус бүрээр оролдлогыг хязгаарлана.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  const phone = normalizePhone(String(b?.phone ?? ""));
  if (!phone || !isPin(b?.pin)) return NextResponse.json({ error: "Дугаар эсвэл PIN буруу байна" }, { status: 400 });

  const [byPhone, byIp] = await Promise.all([
    rateLimit(`login:phone:${phone}`, L.loginPerPhone.max, L.loginPerPhone.windowSec),
    rateLimit(`login:ip:${getClientIp(req)}`, L.loginPerIp.max, L.loginPerIp.windowSec),
  ]);
  if (!byPhone.allowed || !byIp.allowed)
    return NextResponse.json({ error: `Хэт олон оролдлого. ${waitText(byPhone.allowed ? L.loginPerIp.windowSec : L.loginPerPhone.windowSec)} дараа дахин оролдоно уу` }, { status: 429 });

  try {
    const { error } = await (await supabaseServer()).auth.signInWithPassword({
      email: phoneToEmail(phone),
      password: pinPassword(phone, b.pin),
    });
    if (error) return NextResponse.json({ error: "Дугаар эсвэл PIN буруу байна" }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[login]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Алдаа гарлаа" }, { status: 500 });
  }
}
