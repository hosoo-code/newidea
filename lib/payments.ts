import { supabaseAdmin } from "./supabase";
import { DEFAULT_PLANS, isPlanId } from "./plans";
import { wireGetIntent } from "./wire";

// Wire-аас төлбөрийг дахин асууж (body-д итгэхгүй), амжилттай бол Premium олгоно. Идемпотент.
export async function reconcilePayment(wireIntentId: string): Promise<"succeeded" | "pending" | "failed"> {
  const db = supabaseAdmin();
  const { data: pay } = await db
    .from("payments")
    .select("id,plan,amount,status,days")
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
    // Төлбөр үүсэх үед хадгалсан хоногийг ашиглана (admin дараа нь зассан ч өөрчлөгдөхгүй)
    const days = pay.days ?? DEFAULT_PLANS[pay.plan].days;
    await db.rpc("fulfill_payment", { p_payment_id: pay.id, p_days: days });
    return "succeeded";
  }
  if (pi.status === "canceled" || pi.status === "failed") {
    await db.from("payments").update({ status: pi.status }).eq("id", pay.id).eq("status", "pending");
    return "failed";
  }
  return "pending";
}
