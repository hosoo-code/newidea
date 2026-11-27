import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { r2, R2_IMAGES_BUCKET } from "@/lib/r2";

// Poster / backdrop зургийг Cloudflare R2 руу хадгална.
// /api/admin/** нь middleware-ээр admin эрхээр хамгаалагдсан.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const publicBase = (process.env.R2_IMAGES_PUBLIC_URL?.trim() || process.env.R2_PUBLIC_URL?.trim())?.replace(/\/$/, "");
  if (!process.env.R2_ACCOUNT_ID || !R2_IMAGES_BUCKET() || !publicBase) {
    return NextResponse.json({ error: "R2 тохируулаагүй байна" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 400 });
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Зөвхөн JPG, PNG, WebP, AVIF зураг" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Зураг 10MB-аас бага байх ёстой" }, { status: 400 });
  }

  const kind = form.get("kind") === "backdrop" ? "backdrops" : "posters";
  const key = `${kind}/${randomUUID()}.${ext}`;

  try {
    await r2().send(
      new PutObjectCommand({
        Bucket: R2_IMAGES_BUCKET(),
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } catch (e: any) {
    const name = e?.name ?? "Error";
    const msg = e?.message ?? String(e);
    const http = e?.$metadata?.httpStatusCode;
    console.error("[r2] image upload failed:", { name, msg, http, bucket: R2_IMAGES_BUCKET() }, e);
    // admin-only route тул жинхэнэ шалтгааныг харуулна
    return NextResponse.json(
      { error: `R2 руу upload амжилтгүй: ${name}${http ? ` (${http})` : ""} — ${msg}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: `${publicBase}/${key}`, key });
}
