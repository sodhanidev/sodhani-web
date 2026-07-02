"""Inc42 Industry News scraper.

Loops every industry `/stories/` page, drives Playwright (headless chromium)
to render the dynamic content, parses cards via parser.py, and writes the
combined result to exports/inc42_news.json + exports/inc42_news.csv.
"""

import csv
import json
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

from industries import INDUSTRIES
from parser import parse_articles

BASE = "https://inc42.com"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)
FIELDS = [
    "industry",
    "title",
    "article_url",
    "author",
    "published_date",
    "category",
    "thumbnail_url",
    "excerpt",
]
OUT_DIR = Path(__file__).parent.parent / "exports"
DELAY_SECONDS = 1.5


def scrape_industry(page, slug: str, name: str) -> tuple[list[dict], str | None]:
    """Return (articles, note). note is set when nothing could be scraped."""
    url = f"{BASE}/industry/{slug}/stories/"
    page.goto(url, wait_until="networkidle", timeout=60000)
    # Invalid industry slugs 302 away from /industry/ to a generic buzz page.
    if "/industry/" not in page.url:
        return [], "not a valid Inc42 industry profile (redirected away)"
    # Wait for the article cards to render; tolerate pages with none.
    try:
        page.wait_for_selector("h3.card-heading", timeout=15000)
    except Exception:
        pass
    # Nudge lazy content: scroll to bottom a couple of times.
    for _ in range(3):
        page.mouse.wheel(0, 4000)
        page.wait_for_timeout(700)
    return parse_articles(page.content(), name), None


def main():
    OUT_DIR.mkdir(exist_ok=True)
    all_articles: list[dict] = []
    seen: set[str] = set()
    total = len(INDUSTRIES)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=UA)
        page = context.new_page()

        for i, (slug, name) in enumerate(INDUSTRIES, 1):
            print(f"[{i}/{total}] Scraping {name}...")
            try:
                articles, note = scrape_industry(page, slug, name)
            except Exception as e:
                print(f"  ✗ failed: {type(e).__name__}: {e}")
                continue

            added = 0
            for a in articles:
                if a["article_url"] in seen:
                    continue
                seen.add(a["article_url"])
                all_articles.append(a)
                added += 1
            print(f"  ✓ {added} articles collected")
            if added == 0 and note:
                print(f"    ({note})")

            if i < total:
                time.sleep(DELAY_SECONDS)

        browser.close()

    write_json(all_articles)
    write_csv(all_articles)
    print(f"\nDone. {len(all_articles)} total articles -> {OUT_DIR}")


def write_json(articles: list[dict]):
    (OUT_DIR / "inc42_news.json").write_text(
        json.dumps(articles, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def write_csv(articles: list[dict]):
    with (OUT_DIR / "inc42_news.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        for a in articles:
            # None -> "" for CSV
            w.writerow({k: ("" if a.get(k) is None else a[k]) for k in FIELDS})


if __name__ == "__main__":
    main()
