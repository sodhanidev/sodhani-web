"""BeautifulSoup HTML -> list of article dicts.

All Inc42-frontend-specific selectors live here so they are easy to update
when the site changes. The stable anchor is the heading link
(``h3.card-heading > a``); everything else is located relative to the card
wrapper that contains it.
"""

import re
from urllib.parse import urljoin, urlparse, urlunparse

from bs4 import BeautifulSoup

BASE = "https://inc42.com"

# --- Selectors (update here when Inc42's frontend changes) -----------------
SEL_HEADING = "h3.card-heading"           # article title heading, contains <a>
SEL_CARD_WRAPPER = "div.latest-story-section-layout"  # per-article content block
CLS_CATEGORY = "new-post-category"        # the "News / In-Depth" label anchor
# author + date live in the CardFooterText block; author is an /author/ link,
# date is the trailing "| 30th June 2026" span.
RE_AUTHOR = re.compile(r"/author/", re.I)
RE_IMG_ASSET = re.compile(r"asset\.inc42\.com|inc42\.com/cdn-cgi", re.I)


def _clean_url(href: str | None) -> str | None:
    """Absolutize and strip Inc42's itm_* tracking query params."""
    if not href:
        return None
    absu = urljoin(BASE, href)
    p = urlparse(absu)
    return urlunparse((p.scheme, p.netloc, p.path, "", "", ""))


def _text(node) -> str | None:
    if node is None:
        return None
    t = node.get_text(" ", strip=True)
    return t or None


def _closest_card(heading):
    """Walk up from a heading to the wrapper that also holds footer/image."""
    node = heading
    for _ in range(6):
        node = node.parent
        if node is None:
            break
        classes = node.get("class") or []
        if "latest-story-section-layout" in classes:
            # go one more level up: the grid row that also contains the image
            row = node
            for _ in range(3):
                row = row.parent
                if row is None:
                    break
                if row.find("img"):
                    return row
            return node
    return heading.parent


def _find_image(card, article_url: str) -> str | None:
    """Find the thumbnail. Prefer an <img> whose parent <a> points at the
    same article; fall back to any content image in the card."""
    for img in card.find_all("img"):
        src = img.get("src") or img.get("data-src")
        if not src:
            continue
        a = img.find_parent("a", href=True)
        if a and _clean_url(a["href"]) == article_url:
            return urljoin(BASE, src)
    for img in card.find_all("img"):
        src = img.get("src") or img.get("data-src")
        if src and RE_IMG_ASSET.search(src):
            return urljoin(BASE, src)
    return None


def _find_category(card) -> str | None:
    a = card.find("a", class_=CLS_CATEGORY)
    if a:
        return _text(a)
    # fallback: any post-category anchor that is not an author link
    for a in card.find_all("a", class_="post-category", href=True):
        if not RE_AUTHOR.search(a["href"]):
            return _text(a)
    return None


def _find_author_and_date(card):
    author = None
    date = None
    a = card.find("a", href=RE_AUTHOR)
    if a:
        author = _text(a)
    # date sits in a span like "| 30th June 2026"
    for span in card.find_all("span"):
        t = span.get_text(strip=True)
        if t.startswith("|"):
            date = t.lstrip("|").strip() or None
            break
    return author, date


def _find_excerpt(card, title: str | None) -> str | None:
    for p in card.find_all("p"):
        t = _text(p)
        if t and t != title:
            return t
    return None


def parse_articles(html: str, industry: str) -> list[dict]:
    """Return a deduped (by article_url) list of article dicts for one page."""
    soup = BeautifulSoup(html, "html.parser")
    out: list[dict] = []
    seen: set[str] = set()

    for heading in soup.select(SEL_HEADING):
        link = heading.find("a", href=True)
        if not link:
            continue
        url = _clean_url(link["href"])
        if not url or url in seen:
            continue
        seen.add(url)

        card = _closest_card(heading)
        author, date = _find_author_and_date(card)
        out.append(
            {
                "industry": industry,
                "title": _text(heading),
                "article_url": url,
                "author": author,
                "published_date": date,
                "category": _find_category(card),
                "thumbnail_url": _find_image(card, url),
                "excerpt": _find_excerpt(card, _text(heading)),
            }
        )
    return out


def _demo():
    """Self-check on a minimal card fixture mirroring Inc42's real markup."""
    fixture = """
    <div class="MuiGrid-root MuiGrid-container">
      <div class="companyDetailStyle__ImageLayoutStyled">
        <a href="https://inc42.com/buzz/some-story/?itm_medium=web">
          <img src="/cdn-cgi/image/quality=90/https://asset.inc42.com/x-490x360.jpg"/>
        </a>
      </div>
      <div class="latest-story-section-layout"><div class="v5-card-content"><div>
        <a class="post-category new-post-category" href="https://inc42.com/buzz/?itm">News</a>
        <h3 class="card-heading">
          <a href="https://inc42.com/buzz/some-story/?itm_source=x">Some Story Title</a>
        </h3>
      </div>
      <div class="CardFooterText">
        <a class="post-category" href="https://inc42.com/author/jane-doe/?itm"><span>Jane Doe</span></a>
        <span>| 30th June 2026</span>
      </div>
      </div></div>
    </div>
    """
    got = parse_articles(fixture, "Testing")
    assert len(got) == 1, got
    a = got[0]
    assert a["title"] == "Some Story Title", a
    assert a["article_url"] == "https://inc42.com/buzz/some-story/", a  # tracking stripped
    assert a["author"] == "Jane Doe", a
    assert a["published_date"] == "30th June 2026", a
    assert a["category"] == "News", a
    assert a["thumbnail_url"].endswith("x-490x360.jpg"), a
    assert a["excerpt"] is None, a
    # dedupe: a second identical heading must not double-count
    assert len(parse_articles(fixture + fixture, "Testing")) == 1
    print("parser self-check OK")


if __name__ == "__main__":
    _demo()
