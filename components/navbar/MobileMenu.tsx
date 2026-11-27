"use client";
import { useEffect, useState } from "react";
import { Menu, X, Crown, ShieldCheck, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/admin/LogoutButton";
import { useMe } from "@/lib/useMe";
import { NAV_ITEMS, isActive } from "./navItems";

const MobileMenu = () => {
  const { loggedIn, isAdmin } = useMe();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  // Хуудас солигдоход хаана
  useEffect(() => setIsOpen(false), [pathname]);

  // Нээлттэй үед ар талын scroll түгжиж, Esc дарвал хаана
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const row = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors active:scale-[0.99] ${
      active ? "bg-theme-primary text-black" : "text-gray-200 hover:bg-gray-800/70 hover:text-white"
    }`;

  return (
    <>
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen((p) => !p)}
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800/60 text-white transition-all hover:bg-gray-700 active:scale-95 focus:outline-none"
          aria-expanded={isOpen}
          aria-label="Цэс нээх/хаах"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed top-16 left-0 w-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-gray-800/60 bg-black/95 backdrop-blur-xl shadow-2xl shadow-black/60 md:hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <nav className="px-3 py-3 space-y-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={close} className={row(isActive(pathname, href))}>
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            ))}

            <div className="my-2 border-t border-gray-800/70" />

            <Link
              href="/premium"
              onClick={close}
              className={`${row(isActive(pathname, "/premium"))} ${
                isActive(pathname, "/premium") ? "" : "border border-theme-primary/40 bg-theme-primary/10 !text-theme-primary"
              }`}
            >
              <Crown className="h-5 w-5 shrink-0" />
              {loggedIn ? "Premium / Профайл" : "Premium"}
            </Link>

            {isAdmin && (
              <Link href="/admin" onClick={close} className={row(isActive(pathname, "/admin"))}>
                <ShieldCheck className="h-5 w-5 shrink-0" />
                Admin
              </Link>
            )}

            {loggedIn ? (
              <div className="px-4 py-3" onClick={close}>
                <LogoutButton />
              </div>
            ) : (
              <Link
                href="/login"
                onClick={close}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-theme-primary px-4 py-3 text-[15px] font-semibold text-black active:scale-[0.99]"
              >
                <LogIn className="h-5 w-5" />
                Нэвтрэх
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
};
export default MobileMenu;
