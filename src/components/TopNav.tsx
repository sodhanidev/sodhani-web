import Link from "next/link";
import Image from "next/image";
import { css } from "@/lib/css-module";
import styles from "./layout.module.css";

import { AuthNavStatus } from "./AuthNavStatus";
import { CommandSearch } from "./CommandSearch";
import { ThemeSwitch } from "./ThemeSwitch";

export function TopNav() {
  return (
    <header className={css(styles, "topbar")}>
      <div className={css(styles, "shell topbar-inner")}>
        <Link className={css(styles, "brand")} href="/">
          <Image
            className={css(styles, "brand-mark")}
            src="/logo-transparent.png"
            alt="SAFEedge"
            width={38}
            height={38}
            priority
          />
          <span>SAFEedge</span>
        </Link>
        <CommandSearch />
        <div className={css(styles, "topbar-actions")}>
          <AuthNavStatus />
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
