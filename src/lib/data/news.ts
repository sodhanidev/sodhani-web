// Loader for the committed Inc42 news snapshot (exports/inc42_news.json,
// produced by scraper/scraper.py). Read once at module load and cached — the
// site ships fully static (AGENTS.md §4), so nothing fetches at request time.
//
// Slug = last path segment of the article URL (verified unique across the set).
import fs from "node:fs";
import path from "node:path";

export type NewsArticle = {
  slug: string;
  title: string;
  articleUrl: string;
  author: string | null;
  publishedDate: string | null;
  industry: string | null;
  category: string | null;
  thumbnailUrl: string | null;
  excerpt: string | null;
  /** Full scraped body; only ~30% of articles have it (rest are excerpt-only). */
  content: string | null;
};

type RawArticle = {
  title?: string;
  article_url?: string;
  author?: string | null;
  published_date?: string | null;
  industry?: string | null;
  category?: string | null;
  thumbnail_url?: string | null;
  excerpt?: string | null;
  content?: string | null;
};

const SNAPSHOT_FILE = path.join(process.cwd(), "exports", "inc42_news.json");

function slugFromUrl(url: string): string {
  return url.replace(/\/+$/u, "").split("/").pop() ?? url;
}

let cache: NewsArticle[] | null = null;

function load(): NewsArticle[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8")) as RawArticle[];
    cache = raw
      .filter((a): a is RawArticle & { article_url: string } => Boolean(a.article_url))
      .map((a) => ({
        slug: slugFromUrl(a.article_url),
        title: a.title ?? "Untitled",
        articleUrl: a.article_url,
        author: a.author ?? null,
        publishedDate: a.published_date ?? null,
        industry: a.industry ?? null,
        category: a.category ?? null,
        thumbnailUrl: a.thumbnail_url ?? null,
        excerpt: a.excerpt ?? null,
        content: a.content && a.content.trim() ? a.content : null
      }));
  } catch {
    cache = [];
  }
  return cache;
}

export function getAllNews(): NewsArticle[] {
  return load();
}

export function getNewsSlugs(): string[] {
  return load().map((a) => a.slug);
}

export function getNewsBySlug(slug: string): NewsArticle | undefined {
  return load().find((a) => a.slug === slug);
}
