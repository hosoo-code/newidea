import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID!;

export const r2 = () =>
  new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

export const R2_BUCKET = () => process.env.R2_BUCKET!;
export const r2PublicUrl = (key: string) =>
  `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;

// Poster/backdrop-ийн public base (public bucket / custom domain). Тохируулаагүй бол R2_PUBLIC_URL.
const imagesBase = () => (process.env.R2_IMAGES_PUBLIC_URL || process.env.R2_PUBLIC_URL)?.replace(/\/$/, "");

// url манай R2 дээр байвал object-ийг устгана (бусад линкэнд хүрэхгүй). Видео болон зураг хоёуланд ажиллана.
export async function deleteR2ObjectByUrl(url?: string | null) {
  if (!url) return;
  const bases = [process.env.R2_PUBLIC_URL?.replace(/\/$/, ""), imagesBase()].filter(Boolean) as string[];
  const base = bases.find((b) => url.startsWith(`${b}/`));
  if (!base) return;
  const key = decodeURIComponent(url.slice(base.length + 1).split("?")[0]);
  try {
    await r2().send(new DeleteObjectCommand({ Bucket: R2_BUCKET(), Key: key }));
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
