import { Home, Film, Clapperboard, Tv, Bookmark } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/films", label: "Films", icon: Film },
  { href: "/movie", label: "Movies", icon: Clapperboard },
  { href: "/series", label: "Series", icon: Tv },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
] as const;

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
