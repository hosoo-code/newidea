import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Нэвтрэх | Kino Mangas", robots: { index: false } };

// Зөвхөн сайтын дотоод зам руу чиглүүлнэ (open redirect-ээс сэргийлнэ)
const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="app-bg-enhanced min-h-screen pt-16 flex items-center justify-center px-4">
      <AuthForm next={safeNext(next)} />
    </div>
  );
}
