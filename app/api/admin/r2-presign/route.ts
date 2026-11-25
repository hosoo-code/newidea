import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { r2, R2_BUCKET, r2PublicUrl } from "@/lib/r2";

const ALLOWED: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export async function POST(req: NextRequest) {
  const { contentType } = await req.json().catch(() => ({}));
  const ext = ALLOWED[contentType as string];
  if (!ext) {
    return NextResponse.json({ error: "Зөвхөн MP4 эсвэл WebM (браузер дээр тоглогдоно)" }, { status: 400 });
  }
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_BUCKET || !process.env.R2_PUBLIC_URL) {
    return NextResponse.json({ error: "R2 тохируулаагүй байна" }, { status: 500 });
  }

  const key = `movies/${randomUUID()}.${ext}`;
  const uploadUrl = await getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: R2_BUCKET(), Key: key, ContentType: contentType }),
    { expiresIn: 60 * 60 } // 1 цаг
  );
  return NextResponse.json({ uploadUrl, publicUrl: r2PublicUrl(key), key });
}
