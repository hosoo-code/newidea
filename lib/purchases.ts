import { supabaseAdmin } from "./supabase";

// Хэрэглэгч энэ киног тусад нь худалдаж авсан эсэх
export async function hasPurchasedMovie(userId: string | null | undefined, movieId: number): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data } = await supabaseAdmin()
      .from("movie_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("movie_id", movieId)
      .limit(1);
    return (data?.length ?? 0) > 0;
  } catch (e) {
    console.error("[purchases] hasPurchasedMovie failed", e);
    return false;
  }
}
