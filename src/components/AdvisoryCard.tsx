import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { ADVISORY_BULLETS } from "@/lib/data/screener-promo";

// Split RA-Hub advisory promo, rendered as bento-tile content (the accent tile).
// Split out of ScreenerInsights.
export function AdvisoryCard() {
  return (
    <>
      <div className={css(styles, "advisory-panel", "advisory-panel-gold")}>
        <h3 className={css(styles, "advisory-title")}>
          Enhance your portfolio by verified RA advisories
        </h3>
        <ul className={css(styles, "advisory-list")}>
          <li>
            <Check size={16} aria-hidden="true" />
            Access verified research ideas from registered analysts.
          </li>
          <li>
            <Check size={16} aria-hidden="true" />
            Compare advisory calls before acting on opportunities.
          </li>
          <li>
            <Check size={16} aria-hidden="true" />
            Track guidance that fits your portfolio goals.
          </li>
        </ul>
        <Link className={css(styles, "advisory-account-cta")} href="/sign-up/">
          Make an account
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div className={css(styles, "advisory-panel", "advisory-panel-navy")}>
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
      </div>
    </>
  );
}
