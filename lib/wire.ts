import { createHmac, timingSafeEqual } from "crypto";

// Wire (app.wire.mn) төлбөрийн API – https://api.wire.mn
// Auth: Authorization: Bearer <WIRE_SECRET_KEY>; POST бүрд Idempotency-Key.
// QPay зэрэг operator-уудыг Wire dashboard дээр project-доо идэвхжүүлнэ.
const BASE = process.env.WIRE_API_URL || "https://api.wire.mn";

export interface WirePaymentIntent {
  id: string;
  status: string; // жишээ: requires_payment_method | ... | succeeded
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  next_action?: unknown;
  selected_operator?: string | null;
  expires_at?: number | null;
}

export class WireError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function wire<T>(method: "GET" | "POST", path: string, body?: unknown, idemKey?: string): Promise<T> {
  const key = process.env.WIRE_SECRET_KEY;
  if (!key) throw new WireError("WIRE_SECRET_KEY тохируулаагүй байна", 500);
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(method === "POST" && idemKey ? { "Idempotency-Key": idemKey } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (json as { error?: { message?: string; code?: string } }).error;
    throw new WireError(err?.message || `Wire алдаа (${res.status})`, res.status, err?.code);
  }
  return json as T;
}

export const wireCreateIntent = (
  p: { amount: number; metadata: Record<string, string> },
  idemKey: string
) => {
  const ops = process.env.WIRE_OPERATORS?.split(",").map((s) => s.trim()).filter(Boolean);
  return wire<WirePaymentIntent>(
    "POST",
    "/v1/payment_intents",
    {
      amount: p.amount,
      currency: "MNT",
      metadata: p.metadata,
      ...(ops?.length ? { allowed_operators: ops } : {}), // хоосон бол project дээр идэвхтэй operator-уудаар
    },
    idemKey
  );
};

export const wireConfirmIntent = (id: string, idemKey: string) =>
  wire<WirePaymentIntent>(
    "POST",
    `/v1/payment_intents/${encodeURIComponent(id)}/confirm`,
    process.env.NEXT_PUBLIC_SITE_URL ? { return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/premium?paid=1` } : {},
    idemKey
  );

export const wireGetIntent = (id: string) =>
  wire<WirePaymentIntent>("GET", `/v1/payment_intents/${encodeURIComponent(id)}`);

// Webhook: header "WirePayment-Signature: t=<unix>,v1=<hex>", v1 = HMAC-SHA256(secret, `${t}.${rawBody}`), 300 сек tolerance.
export function verifyWebhook(rawBody: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false;
  let t = 0;
  let v1 = "";
  for (const part of header.split(",")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === "t") t = Number(rest.join("="));
    if (k === "v1") v1 = rest.join("=");
  }
  if (!t || !v1 || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
