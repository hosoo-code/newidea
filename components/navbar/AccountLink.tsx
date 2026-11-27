"use client";
import Link from "next/link";
import { Crown, ShieldCheck } from "lucide-react";
import LogoutButton from "@/components/admin/LogoutButton";
import { useMe } from "@/lib/useMe";

export default function AccountLink() {
  const { loggedIn, isAdmin } = useMe();
  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className="hidden sm:inline-flex h-9 items-center rounded-xl bg-theme-primary px-4 text-sm font-semibold text-black transition-all hover:brightness-110 active:scale-95"
      >
        Нэвтрэх
      </Link>
    );
  }
  return (
    <div className="hidden sm:flex items-center gap-2 text-sm">
      {isAdmin && (
        <Link
          href="/admin"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-700 px-3 text-gray-200 hover:border-theme-primary hover:text-theme-primary transition-colors"
        >
          <ShieldCheck className="h-4 w-4" /> Admin
        </Link>
      )}
      <Link
        href="/premium"
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-theme-primary/40 bg-theme-primary/10 px-3 font-medium text-theme-primary hover:bg-theme-primary/20 transition-colors"
      >
        <Crown className="h-4 w-4" /> Premium
      </Link>
      <LogoutButton />
    </div>
  );
}
