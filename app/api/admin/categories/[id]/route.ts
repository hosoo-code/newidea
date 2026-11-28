import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { adminListCategories, sanitizeCategoryInput } from "@/lib/categories";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

function refresh() {
  revalidatePath("/");
  revalidatePath("/films");
}

// Нэр / нүүрэнд харуулах / баннер тохиргоо засах
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id буруу" }, { status: 400 });
  try {
    const input = sanitizeCategoryInput((await req.json().catch(() => ({}))) as Record<string, unknown>, true);
    const db = supabaseAdmin();
    // Баннерт зөвхөн нэг ангилал байна
    if (input.is_hero === true) await db.from("categories").update({ is_hero: false }).neq("id", id);
    const { error } = await db.from("categories").update(input).eq("id", id);
    if (error) {
      if (error.code === "23505") throw new Error("Ийм нэртэй ангилал аль хэдийн байна");
      throw new Error("Хадгалж чадсангүй");
    }
    refresh();
    return NextResponse.json({ categories: await adminListCategories() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Алдаа гарлаа" }, { status: 400 });
  }
}

// Устгахад кинонууд устахгүй, зөвхөн энэ ангилалаас хасагдана (DB trigger)
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id буруу" }, { status: 400 });
  const { error } = await supabaseAdmin().from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Устгаж чадсангүй" }, { status: 500 });
  refresh();
  return NextResponse.json({ categories: await adminListCategories() });
}
