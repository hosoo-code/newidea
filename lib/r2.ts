import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID!;

export const r2 = () =>
  new S3Client({
    region: "auto",
    // R2 нь шинэ SDK-ийн автомат checksum-ийг (presigned PUT дээр) хүлээж авдаггүй тул зөвхөн шаардлагатай үед тооцно
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

export const R2_BUCKET = () => process.env.R2_BUCKET!; // видео
// Poster/backdrop зургийн тусдаа bucket. Тохируулаагүй бол видеоны bucket-тэй ижил.
export const R2_IMAGES_BUCKET = () => process.env.R2_IMAGES_BUCKET || process.env.R2_BUCKET!;
export const r2PublicUrl = (key: string) =>
  `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;

// url манай R2 дээр байвал object-ийг устгана (бусад линкэнд хүрэхгүй). Видео болон зураг хоёуланд ажиллана.
export async function deleteR2ObjectByUrl(url?: string | null) {
  if (!url) return;
  const strip = (v?: string) => v?.replace(/\/$/, "");
  const targets = [
    { base: strip(process.env.R2_IMAGES_PUBLIC_URL), bucket: R2_IMAGES_BUCKET() }, // зураг
    { base: strip(process.env.R2_PUBLIC_URL), bucket: R2_BUCKET() }, // видео
  ].filter((t): t is { base: string; bucket: string } => !!t.base);
  const hit = targets.find((t) => url.startsWith(`${t.base}/`));
  if (!hit) return;
  const key = decodeURIComponent(url.slice(hit.base.length + 1).split("?")[0]);
  try {
    await r2().send(new DeleteObjectCommand({ Bucket: hit.bucket, Key: key }));
  } catch (e) {
    console.error("[r2] delete failed:", e);
  }
}

// Манай R2-ийн линк бол богино хугацаатай signed URL болгоно (bucket-ийг private байлгана).
// Бусад линк (iframe/гадны) хэвээр буцна.
export async function signPlaybackUrl(url: string, expiresIn = 60 * 60 * 6) {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base || !url.startsWith(`${base}/`)) return url;
  const key = decodeURIComponent(url.slice(base.length + 1).split("?")[0]);
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: R2_BUCKET(), Key: key }), { expiresIn });
}
