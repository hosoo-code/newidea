import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sanitizeMovieInput } from "@/lib/movies";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const input = sanitizeMovieInput(await req.json());
    const { data, error } = await supabaseAdmin()
      .from("movies")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/films");
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Алдаа гарлаа" },
      { status: 400 }
    );
  }
}
