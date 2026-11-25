import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function AccountLink() {
  const p = await getCurrentProfile().catch(() => null);
  if (!p) {
    return (
      <Link href="/login" className="hidden sm:inline-flex px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-sm text-white">
        Нэвтрэх
      </Link>
    );
  }
  return (
    <div className="hidden sm:flex items-center gap-3 text-sm">
      {p.role === "admin" && <Link href="/admin" className="text-yellow-400 hover:text-yellow-300">Admin</Link>}
      <Link href="/premium" className="text-white hover:text-primary">Premium / Профайл</Link>
      <LogoutButton />
    </div>
  );
}
