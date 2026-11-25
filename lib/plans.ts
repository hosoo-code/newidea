// Premium багцууд. Үнийг ЗӨВХӨН сервер тодорхойлно (клиентээс ирсэн дүнд хэзээ ч итгэхгүй).
// Дүн = бүтэн төгрөг (MNT). Env-ээр солино.
export type PlanId = "month" | "year";

export const PLANS: Record<PlanId, { label: string; days: number; amount: number }> = {
  month: { label: "1 сар", days: 30, amount: Number(process.env.PREMIUM_PRICE_MONTH) || 9900 },
  year: { label: "1 жил", days: 365, amount: Number(process.env.PREMIUM_PRICE_YEAR) || 99000 },
};

export const isPlanId = (v: unknown): v is PlanId => v === "month" || v === "year";
