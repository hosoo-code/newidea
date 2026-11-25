import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { reconcilePayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Клиент төлбөрийн төлөвийг polling хийнэ (id = Wire PaymentIntent id). Зөвхөн өөрийн төлбөр.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: pay } = await supabaseAdmin()
    .from("payments")
    .select("user_id")
    .eq("wire_payment_intent_id", id)
    .maybeSingle();
  if (!pay || pay.user_id !== profile.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    return NextResponse.json({ status: await reconcilePayment(id) });
  } catch (e) {
    console.error("[payments/status]", e);
    return NextResponse.json({ status: "pending" });
  }
}
