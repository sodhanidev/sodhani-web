import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { MARKET_NEWS } from "@/lib/data/screener-promo";

// Market news list, rendered as bento-tile content. Split out of ScreenerInsights.
export function NewsPanel() {
  return (
    <>
      <div className={css(styles, "bento-tile-head")}>
        <span className={css(styles, "bento-eyebrow")}>Market news &amp; insights</span>
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
    </>
  );
}
