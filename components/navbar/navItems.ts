import { Home, Film, Clapperboard, Tv, Bookmark } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Нүүр", icon: Home },
  { href: "/films", label: "Бүх кино", icon: Film },
  { href: "/movie", label: "Кинонууд", icon: Clapperboard },
  { href: "/series", label: "Цуврал", icon: Tv },
  { href: "/watchlist", label: "Миний жагсаалт", icon: Bookmark },
] as const;

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
