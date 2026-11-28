import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = 86_400_000;

// /api/admin/** нь middleware-ээр хамгаалагдсан; энд дахин шалгана.
export async function PATCH(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json().catch(() => null);
  const id = typeof b?.id === "string" ? b.id : "";
  if (!UUID.test(id)) return NextResponse.json({ error: "Хэрэглэгчийн ID буруу" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: user, error: readErr } = await db.from("profiles").select("id,role,premium_until").eq("id", id).maybeSingle();
  if (readErr || !user) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  let patch: { role?: "user" | "admin"; premium_until?: string | null };

  switch (b?.action) {
    case "grant_premium": {
      const days = Number(b.days);
      if (!Number.isInteger(days) || days < 1 || days > 3660)
        return NextResponse.json({ error: "Хоног 1-3660 хооронд бүхэл тоо байна" }, { status: 400 });
      // Идэвхтэй эрх байвал дуусах огнооноос нь үргэлжлүүлнэ (худалдан авалттай ижил)
      const cur = user.premium_until ? new Date(user.premium_until).getTime() : 0;
      const start = Math.max(Date.now(), cur);
      patch = { premium_until: new Date(start + days * DAY).toISOString() };
      break;
    }
    case "revoke_premium":
      patch = { premium_until: null };
      break;
    case "set_role": {
      if (b.role !== "admin" && b.role !== "user") return NextResponse.json({ error: "Эрх буруу" }, { status: 400 });
      if (id === me.id && b.role !== "admin")
        return NextResponse.json({ error: "Өөрийнхөө admin эрхийг хасаж болохгүй" }, { status: 400 });
      patch = { role: b.role };
      break;
    }
    default:
      return NextResponse.json({ error: "Үйлдэл буруу" }, { status: 400 });
  }

  const { data, error } = await db.from("profiles").update(patch).eq("id", id).select("id,role,premium_until").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/users");
  return NextResponse.json(data);
}
