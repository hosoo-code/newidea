import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// /admin/** болон /api/admin/** → Supabase-аар нэвтэрсэн + profiles.role = 'admin' байх ёстой.
// Мөн бүх хүсэлт дээр Supabase session cookie-г шинэчилнэ.
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { pathname } = req.nextUrl;
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdminArea) {
    await sb.auth.getUser(); // session шинэчлэх
    return res;
  }

  const { data: { user } } = await sb.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
    isAdmin = data?.role === "admin";
  }
  if (isAdmin) return res;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: user ? "Forbidden" : "Unauthorized" }, { status: user ? 403 : 401 });
  }
  const url = req.nextUrl.clone();
  if (user) {
    url.pathname = "/"; // нэвтэрсэн ч admin биш
    url.search = "";
  } else {
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks/).*)"],
};
