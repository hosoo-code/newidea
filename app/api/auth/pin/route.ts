import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabasePublic } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabaseServer";
import { PHONE_EMAIL_DOMAIN } from "@/lib/phone";
import { isPin, pinPassword } from "@/lib/pin";
import { rateLimit } from "@/lib/rateLimit";
import { AUTH_LIMITS as L } from "@/lib/authLimits";

// Нэвтэрсэн (session-тэй) хэрэглэгч хуучин PIN-ээ баталгаажуулаад шинэ PIN үүсгэнэ.
export async function POST(req: NextRequest) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!user.email?.endsWith(`@${PHONE_EMAIL_DOMAIN}`))
    return NextResponse.json({ error: "PIN зөвхөн утасны дугаараар бүртгүүлсэн хэрэглэгчид солигдоно" }, { status: 400 });

  const b = await req.json().catch(() => null);
  if (!isPin(b?.oldPin) || !isPin(b?.newPin)) return NextResponse.json({ error: "PIN код 4 оронтой тоо байна" }, { status: 400 });
  if (b.oldPin === b.newPin) return NextResponse.json({ error: "Шинэ PIN хуучнаасаа өөр байх ёстой" }, { status: 400 });

  const rl = await rateLimit(`pinchg:${user.id}`, L.pinChangePerUser.max, L.pinChangePerUser.windowSec);
  if (!rl.allowed) return NextResponse.json({ error: "Хэт олон оролдлого. 15 минутын дараа дахин оролдоно уу" }, { status: 429 });

  try {
    const phone = user.email.split("@")[0];
    // Хуучин PIN-ийг cookie-д нөлөөлөхгүй тусдаа клиентээр шалгана
    const { error: oldErr } = await supabasePublic().auth.signInWithPassword({
      email: user.email,
      password: pinPassword(phone, b.oldPin),
    });
    if (oldErr) return NextResponse.json({ error: "Хуучин PIN буруу байна" }, { status: 401 });

    const { error } = await supabaseAdmin().auth.admin.updateUserById(user.id, { password: pinPassword(phone, b.newPin) });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Бусад төхөөрөмж дээрх session-уудыг хаана (одоогийнх үлдэнэ)
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session) await supabaseAdmin().auth.admin.signOut(session.access_token, "others");
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pin change]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Алдаа гарлаа" }, { status: 500 });
  }
}
