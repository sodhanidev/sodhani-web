import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { ADVISORY_BULLETS } from "@/lib/data/screener-promo";

// Blue RA-Hub advisory promo, rendered as bento-tile content (the accent tile).
// Split out of ScreenerInsights.
export function AdvisoryCard() {
  return (
    <>
      <h3 className={css(styles, "advisory-title")}>
        Scale your Advisory Business with the RA Hub
      </h3>
      <ul className={css(styles, "advisory-list")}>
        {ADVISORY_BULLETS.map((bullet) => (
          <li key={bullet}>
            <Check size={16} aria-hidden="true" />
            {bullet}
          </li>
        ))}
      </ul>
      <Link className={css(styles, "advisory-cta")} href="/market/">
        Join RA Hub
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </>
  );
}
