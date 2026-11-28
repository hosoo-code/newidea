// Утасны дугаараар нэвтрэх: SMS/имэйл илгээхгүйгээр, дугаараас "дотоод имэйл" үүсгэн Supabase-ийн
// email+password нэвтрэлтийг ашиглана. (Supabase → Auth → "Confirm email" унтраасан байх ёстой.)
export const PHONE_EMAIL_DOMAIN = "phone.kinomangas.net";

// "9911 2233", "+976 99112233", "99112233" → "99112233" (Монголын 8 оронтой дугаар) эсвэл null
export function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("976") && d.length === 11) d = d.slice(3);
  return /^[6-9]\d{7}$/.test(d) ? d : null;
}

export const phoneToEmail = (phone: string) => `${phone}@${PHONE_EMAIL_DOMAIN}`;

// Дэлгэцэнд харуулах: "99112233@phone.kinomangas.net" → "99112233"
export function displayIdentity(email: string | null | undefined): string {
  if (!email) return "—";
  return email.endsWith(`@${PHONE_EMAIL_DOMAIN}`) ? email.split("@")[0] : email;
}
