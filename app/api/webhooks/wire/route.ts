import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/wire";
import { reconcilePayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Wire dashboard → Webhooks: https://<domain>/api/webhooks/wire , event: payment_intent.succeeded (+ failed/canceled)
// Signing secret-ийг WIRE_WEBHOOK_SECRET-д хадгална (endpoint үүсгэхэд ганц удаа харагдана).
export async function POST(req: NextRequest) {
  const secret = process.env.WIRE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const raw = await req.text(); // JSON parse хийхээс ӨМНӨ түүхий body-гоор шалгана
  if (!verifyWebhook(raw, req.headers.get("WirePayment-Signature"), secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: { id?: string }; id?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (event.type?.startsWith("payment_intent.")) {
    const intentId = event.data?.object?.id ?? event.data?.id;
    if (intentId) {
      try {
        await reconcilePayment(intentId); // Wire-аас дахин шалгаж баталгаажуулна
      } catch (e) {
        console.error("[webhook/wire]", e);
        return NextResponse.json({ error: "retry" }, { status: 500 }); // Wire дахин илгээнэ
      }
    }
  }
  return NextResponse.json({ received: true });
}
