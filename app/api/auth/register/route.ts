import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabaseServer";
import { normalizePhone, phoneToEmail } from "@/lib/phone";
import { isPin, pinPassword } from "@/lib/pin";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { AUTH_LIMITS as L } from "@/lib/authLimits";

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`reg:${getClientIp(req)}`, L.registerPerIp.max, L.registerPerIp.windowSec);
  if (!rl.allowed) return NextResponse.json({ error: "Хэт олон оролдлого. Түр хүлээнэ үү" }, { status: 429 });

  const b = await req.json().catch(() => null);
  const phone = normalizePhone(String(b?.phone ?? ""));
  if (!phone) return NextResponse.json({ error: "Утасны дугаар буруу байна (8 оронтой)" }, { status: 400 });
  if (!isPin(b?.pin)) return NextResponse.json({ error: "PIN код 4 оронтой тоо байна" }, { status: 400 });

  try {
    const email = phoneToEmail(phone);
    const password = pinPassword(phone, b.pin);
    // email_confirm: true → имэйл баталгаажуулалт шаардахгүй (Supabase "Confirm email" тохиргооноос хамаарахгүй)
    const { error } = await supabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      const taken = /already|registered|exists/i.test(error.message);
      return NextResponse.json({ error: taken ? "Энэ дугаар бүртгэлтэй байна. Нэвтэрнэ үү" : error.message }, { status: taken ? 409 : 400 });
    }
    const { error: signErr } = await (await supabaseServer()).auth.signInWithPassword({ email, password });
    if (signErr) return NextResponse.json({ error: signErr.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Алдаа гарлаа" }, { status: 500 });
  }
}
