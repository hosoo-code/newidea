import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { adminListCategories, sanitizeCategoryInput } from "@/lib/categories";

// /api/admin/** нь middleware-ээр admin эсэхийг шалгагдсан.
export const dynamic = "force-dynamic";

const MIGRATION_HINT = "Хадгалж чадсангүй. supabase/migrations_005_categories.sql ажилласан эсэхийг шалгана уу.";

function refresh() {
  revalidatePath("/");
  revalidatePath("/films");
}

export async function GET() {
  try {
    return NextResponse.json({ categories: await adminListCategories() });
  } catch {
    return NextResponse.json({ error: MIGRATION_HINT }, { status: 500 });
  }
}

// Шинэ ангилал үүсгэнэ (хамгийн сүүлд)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const input = sanitizeCategoryInput(body);
    const db = supabaseAdmin();
    const { data: last } = await db.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await db.from("categories").insert({
      ...input,
      show_on_home: input.show_on_home ?? true,
      is_hero: false,
      is_free: input.is_free ?? false,
      sort_order: (last?.sort_order ?? 0) + 1,
    });
    if (error) {
      if (error.code === "23505") throw new Error("Ийм нэртэй ангилал аль хэдийн байна");
      console.error("[admin/categories]", error);
      throw new Error(MIGRATION_HINT);
    }
    refresh();
    return NextResponse.json({ categories: await adminListCategories() }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Алдаа гарлаа" }, { status: 400 });
  }
}

// Эрэмбэ солих: { order: [id, id, ...] }
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const order: number[] = Array.isArray(body?.order) ? body.order.map(Number).filter((n: number) => Number.isInteger(n)) : [];
  if (order.length === 0) return NextResponse.json({ error: "Хоосон хүсэлт" }, { status: 400 });
  const db = supabaseAdmin();
  const results = await Promise.all(order.map((id, i) => db.from("categories").update({ sort_order: i + 1 }).eq("id", id)));
  if (results.some((r) => r.error)) return NextResponse.json({ error: "Эрэмбэ хадгалж чадсангүй" }, { status: 500 });
  refresh();
  return NextResponse.json({ categories: await adminListCategories() });
}
