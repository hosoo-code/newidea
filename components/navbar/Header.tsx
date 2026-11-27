import Link from "next/link";
import { Search } from "lucide-react";
import Logo from "./Logo";
import AiSuggestionLink from "./AiSuggestionLink";
import MobileMenu from "./MobileMenu";
import AccountLink from "./AccountLink";
import NavLinks from "./NavLinks";

const Header = () => {
  return (
    <nav className="w-full fixed top-0 z-[100] bg-black/80 backdrop-blur-xl border-b border-gray-800/60 shadow-lg shadow-black/30">
      <div className="max-w-7xl flex items-center justify-between mx-auto px-4 sm:px-6 lg:px-8 h-16">
        <Logo />

        <div className="hidden md:block">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          <AiSuggestionLink />

          <Link
            href="/search"
            aria-label="Хайх"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800/60 text-white transition-all duration-200 hover:bg-gray-700 hover:text-theme-primary active:scale-95"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>

          <AccountLink />
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
};

export default Header;
