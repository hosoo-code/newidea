"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

const MobileMenu = ({ loggedIn = false, isAdmin = false }: { loggedIn?: boolean; isAdmin?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleNavbar = () => setIsOpen((prev) => !prev);

  return (
    <>
      {/* Hamburger Button */}
      <div className="md:hidden ml-2">
        <button
          onClick={toggleNavbar}
          type="button"
          className="inline-flex items-center justify-center p-2 text-white hover:text-primary hover:bg-gray-800/50 rounded-lg transition-all duration-200 focus:outline-none"
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          {!isOpen ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-black/95 backdrop-blur-md border-t border-gray-800/50 md:hidden">
          <div className="px-4 py-3 space-y-2">
            {[
              { href: "/", label: "Home" },
              { href: "/films", label: "Films" },
              { href: "/movie", label: "Movies" },
              { href: "/series", label: "Series" },
              { href: "/watchlist", label: "Watchlist" },
              { href: "/premium", label: "Premium" },
              ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-3 px-4 text-sm font-medium text-white hover:text-primary hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {loggedIn && (
              <div className="py-3 px-4" onClick={() => setIsOpen(false)}>
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
export default MobileMenu;
