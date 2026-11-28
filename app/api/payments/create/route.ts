import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getPlan, MOVIE_PRICE } from "@/lib/plans";
import { hasPurchasedMovie } from "@/lib/purchases";
import { isPremium } from "@/lib/auth";
import { isMovieFree } from "@/lib/categories";
import { WireError, wireConfirmIntent, wireCreateIntent } from "@/lib/wire";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

// Гүйлгээний утга: "kinomangas 1 сарын эрх" гэх мэт
const PLAN_DESC: Record<string, string> = {
  month: "1 сарын эрх",
  quarter: "3 сарын эрх",
  half: "6 сарын эрх",
  year: "1 жилийн эрх",
};

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Эхлээд нэвтэрнэ үү" }, { status: 401 });

  const rl = await rateLimit(`pay:${profile.id}:${getClientIp(req)}`, 10, 10 * 60);
  if (!rl.allowed) return NextResponse.json({ error: "Хэт олон оролдлого" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const db = supabaseAdmin();
  const paymentId = randomUUID();

  let amount: number;
  let row: Record<string, unknown>;
  let meta: Record<string, string>;
  let description: string; // банкны аппад харагдах гүйлгээний утга

  if (body?.kind === "movie") {
    // Нэг киног тусад нь худалдаж авах
    const movieId = Number(body.movieId);
    if (!Number.isInteger(movieId) || movieId <= 0) return NextResponse.json({ error: "Кино буруу байна" }, { status: 400 });
    const { data: movie } = await db.from("movies").select("id,published,category_ids").eq("id", movieId).maybeSingle();
    if (!movie || !movie.published) return NextResponse.json({ error: "Кино олдсонгүй" }, { status: 404 });
    if (isPremium(profile) || (await isMovieFree(movie.category_ids)) || (await hasPurchasedMovie(profile.id, movieId)))
      return NextResponse.json({ error: "Танд энэ киног үзэх эрх аль хэдийн байна" }, { status: 409 });
    amount = MOVIE_PRICE;
    description = "kinomangas 1 кино эрх";
    row = { id: paymentId, user_id: profile.id, plan: "movie", amount, movie_id: movieId };
    meta = { payment_id: paymentId, user_id: profile.id, plan: "movie", movie_id: String(movieId) };
  } else {
    const selected = await getPlan(body?.plan);
    if (!selected) return NextResponse.json({ error: "Багц буруу байна" }, { status: 400 });
    amount = selected.amount;
    description = `kinomangas ${PLAN_DESC[selected.id] ?? `${selected.label} эрх`}`;
    row = { id: paymentId, user_id: profile.id, plan: selected.id, amount, days: selected.days };
    meta = { payment_id: paymentId, user_id: profile.id, plan: selected.id };
  }

  const { error: insErr } = await db.from("payments").insert(row);
  if (insErr) return NextResponse.json({ error: "Төлбөр үүсгэж чадсангүй" }, { status: 500 });

  try {
    const created = await wireCreateIntent(
      { amount, metadata: meta, description },
      `create-${paymentId}`
    );
    await db.from("payments").update({ wire_payment_intent_id: created.id }).eq("id", paymentId);
    const pi = await wireConfirmIntent(created.id, `confirm-${paymentId}`);
    return NextResponse.json({
      intentId: pi.id,
      status: pi.status,
      amount,
      nextAction: pi.next_action ?? created.next_action ?? null,
    });
  } catch (e) {
    await db.from("payments").update({ status: "failed" }).eq("id", paymentId);
    const msg = e instanceof WireError ? e.message : "Төлбөрийн системтэй холбогдож чадсангүй";
    console.error("[payments/create]", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
