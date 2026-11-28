import { supabaseAdmin } from "./supabase";
import { DEFAULT_PLANS, isPlanId } from "./plans";
import { wireGetIntent } from "./wire";

// Wire-аас төлбөрийг дахин асууж (body-д итгэхгүй), амжилттай бол Premium олгоно. Идемпотент.
export async function reconcilePayment(wireIntentId: string): Promise<"succeeded" | "pending" | "failed"> {
  const db = supabaseAdmin();
  const { data: pay } = await db
    .from("payments")
    .select("id,plan,amount,status,days,movie_id")
    .eq("wire_payment_intent_id", wireIntentId)
    .maybeSingle();
  if (!pay) return "failed";
  if (pay.status === "succeeded") return "succeeded";

  const pi = await wireGetIntent(wireIntentId);
  if (pi.status === "succeeded") {
    if (pi.amount !== pay.amount) {
      console.error("[wire] amount mismatch", wireIntentId, pi.amount, pay.amount);
      return "failed";
    }
    // Нэг киноны худалдан авалт: тухайн киног хэрэглэгчид нээнэ
    if (pay.plan === "movie") {
      await db.rpc("fulfill_movie_payment", { p_payment_id: pay.id });
      return "succeeded";
    }
    if (!isPlanId(pay.plan)) {
      console.error("[wire] plan mismatch", wireIntentId, pay.plan);
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

// Сүүлийн 3 хоногийн дуусаагүй/амжилтгүй гэж тэмдэглэгдсэн төлбөрүүдийг Wire-аас дахин шалгана.
// Хэрэглэгч "хугацаа дууссан/амжилтгүй" харсны дараа төлсөн, эсвэл webhook ирээгүй тохиолдолд Premium-ийг сэргээнэ.
// Шинээр баталгаажсан төлбөр байвал true.
export async function recoverRecentPayments(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const { data } = await supabaseAdmin()
    .from("payments")
    .select("wire_payment_intent_id")
    .eq("user_id", userId)
    .neq("status", "succeeded")
    .not("wire_payment_intent_id", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5);
  const results = await Promise.all(
    (data ?? []).map((r) => reconcilePayment(r.wire_payment_intent_id as string).catch(() => "pending" as const))
  );
  return results.includes("succeeded");
}
