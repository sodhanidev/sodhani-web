import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";

export function PromoBanner() {
  return (
    <section className={css(styles, "dash-section")}>
      <div className={css(styles, "promo-banner")}>
        <div className={css(styles, "promo-banner-copy")}>
          <h2 className={css(styles, "promo-banner-title")}>
            Are you a SEBI <span>Registered Analyst?</span>
          </h2>
          <p className={css(styles, "promo-banner-sub")}>
            Join the RA Hub and reach thousands of investors.
          </p>
          <Link className={css(styles, "promo-banner-cta")} href="/market/">
            Join Now
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <img
          className={css(styles, "promo-banner-art")}
          src="/sodhani.png"
          alt=""
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
