import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sanitizeMovieInput } from "@/lib/movies";
import { revalidatePath } from "next/cache";
import { deleteR2ObjectByUrl } from "@/lib/r2";

type Ctx = { params: Promise<{ id: string }> };

function refresh(id: string) {
  revalidatePath("/");
  revalidatePath("/films");
  revalidatePath(`/films/${id}`);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const input = sanitizeMovieInput(await req.json());
    const db = supabaseAdmin();
    const { data: prev } = await db.from("movies").select("video_url").eq("id", Number(id)).maybeSingle();
    const { data, error } = await db
      .from("movies")
      .update(input)
      .eq("id", Number(id))
      .select()
      .single();
    if (error) throw error;
    // Видео солигдсон бол хуучин R2 файлыг устгана (өнчин файл үлдээхгүй)
    if (prev?.video_url && prev.video_url !== input.video_url) {
      await deleteR2ObjectByUrl(prev.video_url);
    }
    refresh(id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Алдаа гарлаа" },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const db = supabaseAdmin();
  const { data: existing } = await db.from("movies").select("video_url").eq("id", Number(id)).maybeSingle();
  const { error } = await db.from("movies").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await deleteR2ObjectByUrl(existing?.video_url);
  refresh(id);
  return NextResponse.json({ ok: true });
}
