import Link from "next/link";
import Image from "next/image";

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
            width={38}
            height={38}
            priority
          />
          <span>Sodhani</span>
        </Link>
        <CommandSearch />
      </div>
    </header>
  );
}
