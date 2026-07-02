import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/components/news.module.css";
import { getAllNews, type NewsArticle } from "@/lib/data/news";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Startup News",
  description: "Latest Indian startup and tech news across fintech, edtech, EV, ecommerce and more — sourced from Inc42."
};

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/news/${article.slug}/`} className={css(styles, "card")}>
      {article.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={css(styles, "thumb")} src={article.thumbnailUrl} alt="" loading="lazy" />
      ) : (
        <span className={css(styles, "thumb-fallback")} aria-hidden="true">
          <Newspaper size={28} />
        </span>
      )}
      <div className={css(styles, "card-body")}>
        {article.industry ? <span className={css(styles, "tag")}>{article.industry}</span> : null}
        <h2 className={css(styles, "card-title")}>{article.title}</h2>
        <span className={css(styles, "card-meta")}>
          {article.author ? `${article.author} · ` : ""}
          {article.publishedDate ?? "Inc42"}
        </span>
      </div>
    </Link>
  );
}

export default function NewsPage() {
  const articles = getAllNews();

  return (
    <main className={css(styles, "shell page-stack")}>
      <header className={css(styles, "news-head")}>
        <div className={css(styles, "eyebrow")}>Inc42</div>
        <h1>Startup News</h1>
        <p className={css(styles, "lede")}>
          Latest Indian startup and tech coverage across fintech, edtech, EV, ecommerce and more.
        </p>
      </header>

      <div className={css(styles, "grid")}>
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      <SiteFooter className="footer-bleed" />
    </main>
  );
}
