import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    return NextResponse.json({ error: "Cloudinary тохируулаагүй байна" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 400 });
  }
  if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Зөвхөн 10MB-аас бага зураг" }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "cineworld";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${secret}`)
    .digest("hex");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", key);
  body.append("timestamp", timestamp);
  body.append("folder", folder);
  body.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: json?.error?.message ?? "Upload амжилтгүй" }, { status: 400 });
  }
  return NextResponse.json({ url: json.secure_url as string });
}
