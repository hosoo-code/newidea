import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cookie-д суурилсан Supabase клиент (Server Components / Route Handlers). Нэвтэрсэн хэрэглэгчийн эрхээр ажиллана (RLS үйлчилнэ).
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Server Component-оос дуудсан үед cookie бичих боломжгүй – middleware session-ийг шинэчилдэг тул зүгээр.
          }
        },
      },
    }
  );
}
