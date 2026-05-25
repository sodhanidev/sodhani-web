import Link from "next/link";
import Image from "next/image";
import { BarChart3 } from "lucide-react";

import { CommandSearch } from "./CommandSearch";

export function TopNav() {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link className="brand" href="/">
          <Image
            className="brand-mark"
            src="/logo-transparent.png"
            alt="Sodhani"
            width={30}
            height={30}
            priority
          />
          <span>Sodhani</span>
        </Link>
        <CommandSearch />
        <nav className="nav-links" aria-label="Primary navigation">
          <Link className="nav-link" href="/market/">
            <BarChart3 size={16} aria-hidden="true" />
            Market
          </Link>
        </nav>
      </div>
    </header>
  );
}
