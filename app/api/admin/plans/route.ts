import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { PLAN_IDS, getPlans, isPlanId } from "@/lib/plans";

// /api/admin/** нь middleware-ээр admin эсэхийг шалгагдсан.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ plans: await getPlans({ includeInactive: true }) });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const input: unknown[] = Array.isArray(body?.plans) ? body.plans : [];
  const rows: { id: string; label: string; days: number; amount: number; active: boolean; sort_order: number; updated_at: string }[] = [];

  for (const p of input as Record<string, unknown>[]) {
    const id = p?.id;
    if (!isPlanId(id)) return NextResponse.json({ error: "Багцын id буруу" }, { status: 400 });
    const label = String(p.label ?? "").trim();
    const days = Number(p.days);
    const amount = Number(p.amount);
    if (!label || label.length > 40) return NextResponse.json({ error: "Нэр 1–40 тэмдэгт байх ёстой" }, { status: 400 });
    if (!Number.isInteger(days) || days < 1 || days > 3650) return NextResponse.json({ error: "Хоног 1–3650 бүхэл тоо байх ёстой" }, { status: 400 });
    if (!Number.isInteger(amount) || amount < 100 || amount > 100_000_000) return NextResponse.json({ error: "Үнэ буруу байна (хамгийн багадаа 100₮)" }, { status: 400 });
    rows.push({ id, label, days, amount, active: p.active !== false, sort_order: PLAN_IDS.indexOf(id) + 1, updated_at: new Date().toISOString() });
  }

  if (rows.length === 0) return NextResponse.json({ error: "Хоосон хүсэлт" }, { status: 400 });
  if (!rows.some((r) => r.active)) return NextResponse.json({ error: "Дор хаяж нэг багц идэвхтэй байх ёстой" }, { status: 400 });

  const { error } = await supabaseAdmin().from("plans").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("[admin/plans]", error);
    return NextResponse.json({ error: "Хадгалж чадсангүй. supabase/migrations_003_plans.sql ажилласан эсэхийг шалгана уу." }, { status: 500 });
  }
  revalidatePath("/premium");
  return NextResponse.json({ ok: true, plans: await getPlans({ includeInactive: true }) });
}
