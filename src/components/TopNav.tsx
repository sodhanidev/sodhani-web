import Link from "next/link";
import Image from "next/image";
import { css } from "@/lib/css-module";
import styles from "./layout.module.css";

import { AuthNavStatus } from "./AuthNavStatus";
import { CommandSearch } from "./CommandSearch";

export function TopNav() {
  return (
    <header className={css(styles, "topbar")}>
      <div className={css(styles, "shell topbar-inner")}>
        <Link className={css(styles, "brand")} href="/">
          <Image
            className={css(styles, "brand-mark")}
            src="/logo-transparent.png"
            alt="Sodhani"
            width={38}
            height={38}
            priority
          />
          <span>Sodhani</span>
        </Link>
        <CommandSearch />
        <AuthNavStatus />
      </div>
    </header>
  );
}
