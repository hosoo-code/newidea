import type { NextRequest } from "next/server";

// Upstash Redis (REST) тохируулсан бол instance хооронд хуваалцана, үгүй бол санах ойд (dev / нэг instance).
// Env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
const mem = new Map<string, { count: number; reset: number }>();

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; remaining: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const k = `rl:${key}`;
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", k], ["EXPIRE", k, windowSec, "NX"]]),
        cache: "no-store",
      });
      const out = (await res.json()) as { result: number }[];
      const count = Number(out?.[0]?.result ?? 0);
      return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
    } catch (e) {
      console.error("[rateLimit] redis failed, falling back to memory:", e);
    }
  }

  const now = Date.now();
  if (mem.size > 5000) for (const [k, v] of mem) if (now > v.reset) mem.delete(k);
  const cur = mem.get(key);
  if (!cur || now > cur.reset) {
    mem.set(key, { count: 1, reset: now + windowSec * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  cur.count += 1;
  return { allowed: cur.count <= limit, remaining: Math.max(0, limit - cur.count) };
}
