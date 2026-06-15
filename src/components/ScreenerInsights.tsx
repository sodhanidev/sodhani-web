import Link from "next/link";
import { ArrowRight, Check, Newspaper } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { ADVISORY_BULLETS, MARKET_NEWS } from "@/lib/data/screener-promo";

export function ScreenerInsights() {
  return (
    <section className={css(styles, "dash-section screener-band")}>
      <div className={css(styles, "screener-grid")}>
        {/* Market news */}
        <aside className={css(styles, "news-col")}>
          <div className={css(styles, "dash-section-head")}>
            <h2 className={css(styles, "dash-section-title")}>
              <Newspaper size={18} aria-hidden="true" />
              Market news &amp; insights
            </h2>
            <Link className={css(styles, "dash-view-all")} href="/market/">
              View all
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <ul className={css(styles, "news-list")}>
            {MARKET_NEWS.map((item) => (
              <li key={item.id}>
                <Link href="/market/" className={css(styles, "news-row")}>
                  <span className={css(styles, "news-thumb")} aria-hidden="true">
                    <Newspaper size={18} />
                  </span>
                  <span className={css(styles, "news-copy")}>
                    <span className={css(styles, "news-headline")}>{item.headline}</span>
                    <span className={css(styles, "news-meta")}>
                      {item.source} · {item.ago}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Advisory promo */}
        <aside className={css(styles, "advisory-card")}>
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
        </aside>
      </div>
    </section>
  );
}
