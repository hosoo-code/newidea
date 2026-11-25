import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getPlan } from "@/lib/plans";
import { WireError, wireConfirmIntent, wireCreateIntent } from "@/lib/wire";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Эхлээд нэвтэрнэ үү" }, { status: 401 });

  const rl = await rateLimit(`pay:${profile.id}:${getClientIp(req)}`, 10, 10 * 60);
  if (!rl.allowed) return NextResponse.json({ error: "Хэт олон оролдлого" }, { status: 429 });

  const { plan } = await req.json().catch(() => ({ plan: null }));
  const selected = await getPlan(plan);
  if (!selected) return NextResponse.json({ error: "Багц буруу байна" }, { status: 400 });
  const { amount, days } = selected;

  const db = supabaseAdmin();
  const paymentId = randomUUID();
  const { error: insErr } = await db
    .from("payments")
    .insert({ id: paymentId, user_id: profile.id, plan: selected.id, amount, days });
  if (insErr) return NextResponse.json({ error: "Төлбөр үүсгэж чадсангүй" }, { status: 500 });

  try {
    const created = await wireCreateIntent(
      { amount, metadata: { payment_id: paymentId, user_id: profile.id, plan: selected.id } },
      `create-${paymentId}`
    );
    await db.from("payments").update({ wire_payment_intent_id: created.id }).eq("id", paymentId);
    const pi = await wireConfirmIntent(created.id, `confirm-${paymentId}`);
    return NextResponse.json({
      intentId: pi.id,
      status: pi.status,
      amount,
      nextAction: pi.next_action ?? created.next_action ?? null,
    });
  } catch (e) {
    await db.from("payments").update({ status: "failed" }).eq("id", paymentId);
    const msg = e instanceof WireError ? e.message : "Төлбөрийн системтэй холбогдож чадсангүй";
    console.error("[payments/create]", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
