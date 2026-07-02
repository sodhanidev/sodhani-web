import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/components/news.module.css";
import { getNewsBySlug, getNewsSlugs } from "@/lib/data/news";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getNewsSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsBySlug(slug);
  return {
    title: article ? article.title : "Article",
    description: article?.excerpt ?? article?.title ?? "Startup news."
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getNewsBySlug(slug);

  if (!article) {
    notFound();
  }

  const paragraphs = article.content
    ? article.content.split(/\n{2,}/u).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <main className={css(styles, "shell page-stack")}>
      <article className={css(styles, "article")}>
        <Link href="/news/" className={css(styles, "back")}>
          <ArrowLeft size={15} aria-hidden="true" />
          All news
        </Link>

        {article.industry ? <span className={css(styles, "tag")}>{article.industry}</span> : null}
        <h1>{article.title}</h1>
        <div className={css(styles, "article-meta")}>
          {article.author ? <span>{article.author}</span> : null}
          {article.publishedDate ? <span>{article.publishedDate}</span> : null}
          <span>Inc42</span>
        </div>

        {article.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={css(styles, "hero")} src={article.thumbnailUrl} alt="" />
        ) : null}

        {paragraphs.length ? (
          <div className={css(styles, "body")}>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : (
          <p className={css(styles, "excerpt-note")}>
            {article.excerpt ?? "Read the full story on Inc42."}
          </p>
        )}

        <a
          className={css(styles, "source-link")}
          href={article.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read full article on Inc42
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </article>

      <SiteFooter className="footer-bleed" />
    </main>
  );
}
