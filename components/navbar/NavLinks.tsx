"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./navItems";

// Desktop навигаци: идэвхтэй хуудас pill хэлбэрээр тодорно
export default function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="list-none flex items-center gap-1 rounded-full border border-gray-800/70 bg-gray-900/60 p-1 text-sm font-medium">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-full px-4 py-1.5 transition-colors duration-200 ${
                active
                  ? "bg-theme-primary text-black font-semibold shadow-[0_0_12px_rgba(253,228,2,0.25)]"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
