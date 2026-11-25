import { supabaseAdmin } from "./supabase";
import { PLANS, isPlanId } from "./plans";
import { wireGetIntent } from "./wire";

// Wire-аас төлбөрийг дахин асууж (body-д итгэхгүй), амжилттай бол Premium олгоно. Идемпотент.
export async function reconcilePayment(wireIntentId: string): Promise<"succeeded" | "pending" | "failed"> {
  const db = supabaseAdmin();
  const { data: pay } = await db
    .from("payments")
    .select("id,plan,amount,status")
    .eq("wire_payment_intent_id", wireIntentId)
    .maybeSingle();
  if (!pay) return "failed";
  if (pay.status === "succeeded") return "succeeded";

  const pi = await wireGetIntent(wireIntentId);
  if (pi.status === "succeeded") {
    if (pi.amount !== pay.amount || !isPlanId(pay.plan)) {
      console.error("[wire] amount/plan mismatch", wireIntentId, pi.amount, pay.amount);
      return "failed";
    }
    await db.rpc("fulfill_payment", { p_payment_id: pay.id, p_days: PLANS[pay.plan].days });
    return "succeeded";
  }
  if (pi.status === "canceled" || pi.status === "failed") {
    await db.from("payments").update({ status: pi.status }).eq("id", pay.id).eq("status", "pending");
    return "failed";
  }
  return "pending";
}
