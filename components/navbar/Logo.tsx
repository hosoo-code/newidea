import Link from "next/link";
import React from "react";

// Kino Mangas logo (public/logo.png – ил тод дэвсгэртэй). size: header-д "sm", footer-д "lg".
const Logo = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
  return (
    <Link href="/" aria-label="Kino Mangas" className="flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Kino Mangas"
        width={616}
        height={800}
        className={size === "lg" ? "h-28 w-auto" : "h-14 w-auto py-0.5"}
      />
    </Link>
  );
};

export default Logo;
