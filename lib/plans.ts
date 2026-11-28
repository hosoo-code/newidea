import { supabaseAdmin } from "./supabase";

// Premium багцууд. Үнэ/хоногийг ЗӨВХӨН сервер тодорхойлно (клиентээс ирсэн дүнд хэзээ ч итгэхгүй).
// Admin нь /admin/plans хуудаснаас засна (public.plans хүснэгт). Хүснэгт байхгүй/хоосон бол DEFAULT_PLANS ашиглана.
export const PLAN_IDS = ["month", "quarter", "half", "year"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  label: string;
  days: number;
  amount: number; // бүтэн төгрөг (MNT)
  active: boolean;
};

export const DEFAULT_PLANS: Record<PlanId, Plan> = {
  month: { id: "month", label: "1 сар", days: 30, amount: Number(process.env.PREMIUM_PRICE_MONTH) || 9900, active: true },
  quarter: { id: "quarter", label: "3 сар", days: 90, amount: Number(process.env.PREMIUM_PRICE_QUARTER) || 26900, active: true },
  half: { id: "half", label: "6 сар", days: 180, amount: Number(process.env.PREMIUM_PRICE_HALF) || 27000, active: true },
  year: { id: "year", label: "1 жил", days: 365, amount: Number(process.env.PREMIUM_PRICE_YEAR) || 99000, active: true },
};

export const isPlanId = (v: unknown): v is PlanId => PLAN_IDS.includes(v as PlanId);

export async function getPlans(opts: { includeInactive?: boolean } = {}): Promise<Plan[]> {
  const merged: Record<PlanId, Plan> = { ...DEFAULT_PLANS };
  try {
    const { data, error } = await supabaseAdmin()
      .from("plans")
      .select("id,label,days,amount,active")
      .order("sort_order");
    if (!error && data) {
      for (const r of data) {
        if (isPlanId(r.id)) merged[r.id] = { id: r.id, label: r.label, days: r.days, amount: Number(r.amount), active: r.active };
      }
    }
  } catch (e) {
    console.error("[plans] DB уншиж чадсангүй, default ашиглана", e);
  }
  const list = PLAN_IDS.map((id) => merged[id]);
  return opts.includeInactive ? list : list.filter((p) => p.active);
}

// Худалдан авах боломжтой (идэвхтэй) багц
export async function getPlan(id: unknown): Promise<Plan | null> {
  if (!isPlanId(id)) return null;
  return (await getPlans()).find((p) => p.id === id) ?? null;
}

// Нэг киног тусад нь худалдаж авах үнэ (₮). Env-ээр солих боломжтой.
export const MOVIE_PRICE = Number(process.env.MOVIE_PRICE) || 4000;
