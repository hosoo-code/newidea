import { supabaseServer } from "./supabaseServer";

export interface Profile {
  id: string;
  email: string | null;
  role: "user" | "admin";
  premium_until: string | null;
}

export const isPremium = (p: Pick<Profile, "role" | "premium_until"> | null) =>
  !!p && (p.role === "admin" || (!!p.premium_until && new Date(p.premium_until) > new Date()));

// Нэвтэрсэн хэрэглэгч + профайл (getUser нь токеныг Supabase-ээр баталгаажуулдаг, getSession шиг cookie-д итгэдэггүй)
export async function getCurrentProfile(): Promise<Profile | null> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("profiles")
    .select("id,email,role,premium_until")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile) ?? { id: user.id, email: user.email ?? null, role: "user", premium_until: null };
}

export async function requireAdmin(): Promise<Profile | null> {
  const p = await getCurrentProfile();
  return p?.role === "admin" ? p : null;
}
