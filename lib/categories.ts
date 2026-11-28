import { supabasePublic, supabaseAdmin } from "./supabase";

export interface Category {
  id: number;
  name: string;
  sort_order: number;
  show_on_home: boolean;
  is_hero: boolean;
}

const COLS = "id,name,sort_order,show_on_home,is_hero";

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabasePublic()
      .from("categories")
      .select(COLS)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (error) throw error;
    return (data as Category[]) ?? [];
  } catch (e) {
    // migrations_005 ажиллаагүй бол сайт унахгүй, ангилалгүй харагдана
    console.error("[categories] getCategories failed:", e);
    return [];
  }
}

export async function adminListCategories(): Promise<Category[]> {
  const { data, error } = await supabaseAdmin()
    .from("categories")
    .select(COLS)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data as Category[]) ?? [];
}

// Хүсэлтийн өгөгдлийг цэвэрлэнэ (partial=true бол ирсэн талбарыг л)
export function sanitizeCategoryInput(body: Record<string, unknown>, partial = false) {
  const out: Partial<Omit<Category, "id">> = {};
  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? "").trim();
    if (!name || name.length > 40) throw new Error("Нэр 1–40 тэмдэгт байх ёстой");
    out.name = name;
  }
  if (body.show_on_home !== undefined) out.show_on_home = body.show_on_home === true;
  if (body.is_hero !== undefined) out.is_hero = body.is_hero === true;
  if (body.sort_order !== undefined) {
    const n = Number(body.sort_order);
    if (!Number.isInteger(n)) throw new Error("Эрэмбэ буруу байна");
    out.sort_order = n;
  }
  return out;
}
