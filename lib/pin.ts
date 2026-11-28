import { createHmac } from "crypto";

// ЗӨВХӨН сервер талд. 4 оронтой PIN-ийг Supabase-ийн нууц үг болгохдоо PIN_SECRET-ээр HMAC хийж 64 тэмдэгт болгоно
// (Supabase-ийн нууц үгийн доод урт 6 тул шууд 4 оронг нууц үг болгож болохгүй).
// ⚠️ PIN_SECRET-ийг хэзээ ч солихгүй/алдахгүй байх: соливол бүх хэрэглэгчийн PIN хүчингүй болно.
export const isPin = (v: unknown): v is string => typeof v === "string" && /^\d{4}$/.test(v);

export function pinPassword(phone: string, pin: string): string {
  const secret = process.env.PIN_SECRET;
  if (!secret || secret.length < 16) throw new Error("PIN_SECRET тохируулаагүй байна (16+ тэмдэгт)");
  return createHmac("sha256", secret).update(`${phone}:${pin}`).digest("hex");
}
