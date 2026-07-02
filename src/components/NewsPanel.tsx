import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { getAllNews } from "@/lib/data/news";

// Latest Inc42 startup news, rendered as bento-tile content. Split out of
// ScreenerInsights. Reads the committed snapshot (exports/inc42_news.json).
export function NewsPanel() {
  const items = getAllNews().slice(0, 5);

  return (
    <>
      <div className={css(styles, "bento-tile-head")}>
        <span className={css(styles, "bento-eyebrow")}>Startup news &amp; insights</span>
        <Link className={css(styles, "dash-view-all")} href="/news/">
          View all
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <ul className={css(styles, "news-list")}>
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={`/news/${item.slug}/`} className={css(styles, "news-row")}>
              <span className={css(styles, "news-thumb")} aria-hidden="true">
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnailUrl} alt="" loading="lazy" />
                ) : (
                  <Newspaper size={18} />
                )}
              </span>
              <span className={css(styles, "news-copy")}>
                <span className={css(styles, "news-headline")}>{item.title}</span>
                <span className={css(styles, "news-meta")}>
                  Inc42{item.publishedDate ? ` · ${item.publishedDate}` : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
