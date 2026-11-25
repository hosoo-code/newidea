import Link from "next/link";
import React from "react";

const Logo = () => {
  return (
    <Link
      href="/"
      className="flex justify-center items-center w-32 md:w-40 text-sm md:text-base my-5 font-extrabold text-center"
    >
      <div className="bg-primary py-1 px-2 border border-primary ">
        <p>KINO</p>
      </div>
      <div className="border border-primary py-1 text-primary px-2 ">
        <p>MANGAS</p>
      </div>
    </Link>
  );
};

export default Logo;
