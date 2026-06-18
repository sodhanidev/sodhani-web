# Missing / corrected data — equity API ingest

This file records every field the app expects on a company page that the equity
API (`https://server-production-8226.up.railway.app/equity/{TICKER}`) does **not**
provide correctly, what we did about it, and whether the problem affects **all**
stocks or only **some**.

**No placeholder or dummy values were invented anywhere.** Where data is absent,
the field is left empty and the corresponding section simply does not render
(the page template already hides empty sections). The only "fix" applied is
re-mapping a value the API already returns correctly (see #1). This was verified
across 22 tickers spanning large- and small-cap stocks (RELIANCE, TCS, INFY,
HDFCBANK, ITC, SBIN, WIPRO, ASIANPAINT, BHARTIARTL, LT, MARUTI, SUNPHARMA, TITAN,
plus a random sample of small caps incl. numeric BSE codes).

---

## 1. `overview.current_price` — WRONG for ALL stocks (corrected, no placeholder)

The API puts the **Market Cap** value into `overview.current_price` instead of
the share price. Example (RELIANCE): `current_price = "17,37,577"` while the real
price is `₹ 1,284`. Affected **100% of tickers tested (22/22)**.

**Correction:** the real price is present and correct in
`key_metrics["Current Price"]`. During ingest we source `overview.current_price`
from `key_metrics["Current Price"]` (falling back to the original only if that key
were ever absent). No value is fabricated — we copy a correct value the API
already returns. See `src/lib/data/equity-api.ts` → `sanitizeEquityRaw`.

## 2. `"Raw PDF"` junk row — present in `quarterly` for ALL stocks (stripped)

Every `quarterly` table has a trailing row labelled `"Raw PDF"` with all-empty
period values. Affected **100% of tickers tested**.

**Correction:** the row is dropped during ingest (`sanitizeEquityRaw`). Nothing is
added in its place.

## 3. `overview.about` — EMPTY for ALL stocks (no placeholder; section hidden)

The API always returns `about = ""`. Affected **100% of tickers tested**.

**Handling:** left empty. The template hides the About section when the text is
empty. No description was invented. (Note: `companies.csv` has a `description`
column that could fill this in a future pass, but that is a separate data source,
not the equity API.)

## 4. Price / chart history — ABSENT for ALL stocks (no placeholder; chart hidden)

The API has **no OHLCV / time-series price data** (no `prices` key, no chart
endpoint). Affected **100% of tickers**.

**Consequence:** for API-fetched stocks the price chart and every price-derived
view do **not** render — daily price line, 52-week & all-time high/low,
period returns, and the EV/EBITDA / Price-to-Book / Market-Cap-to-Sales valuation
charts. The template degrades gracefully (chart section hidden). No price points
were fabricated.

**RELIANCE is unaffected:** it keeps its committed `stock_page/reliance_chart_data.csv`,
so its chart still renders. (RELIANCE is never fetched from the API — see below.)

## 5. `documents` — ABSENT for ALL stocks (no placeholder; section hidden)

The API returns no `documents` key at all — no annual reports, announcements,
concall transcripts, or credit ratings. Affected **100% of tickers**.

**Handling:** the Documents section is hidden. No links were invented.

## 6. Empty investor sub-categories — SOME stocks (not an error)

Within `investors.quarterly` / `investors.yearly`, some holder classes come back
as empty objects (e.g. `government: {}`, `foreign_institutions: {}`). This varies
per stock and is **legitimate** — that company simply has no holders in that
class for the period. **Not** a defect; nothing was changed or filled in.

## 7. Shareholder count — PRESENT for all (no issue)

The "No. of Shareholders" figure the metric card needs **is** present, nested as a
child row under the `Public` row in both shareholding tables. The template's
existing lookup finds nested rows, so the card populates correctly. No change
needed.

---

## What was fetched vs. left alone

- **RELIANCE is never fetched** from the API. Its committed on-disk files
  (`stock_page/reliance.json` + `reliance_chart_data.csv`) remain the source of
  truth and were not modified.
- API-fetched JSON is written to `stock_page/*.json` as a **gitignored build
  cache** (see `.gitignore`). Only `reliance.json`, `sunpharma.json`, and
  `tmpv.json` stay tracked in git.

## Scope status & follow-up for full rollout

This change stands up the pipeline and was verified end-to-end on one
API-fetched ticker (CIPLA) plus a structural diff against the committed
SUNPHARMA file. To roll out to all 5,321 tickers in `category_wise/companies.csv`:

1. Run `npm run prefetch:equities` (no args = all tickers) to warm the cache.
2. Change `getCompanyTemplateCodes()` in `src/lib/data/company-template.ts` to
   enumerate from `companies.csv` instead of `getAvailableStockCodes()` so the
   static build emits a page per ticker. (Intentionally **not** changed yet — the
   current file-driven enumeration keeps the proof-of-concept scoped to warmed
   stocks.)
3. Optionally wire `prefetch:equities` into a `prebuild` npm hook. Left out for
   now so `next build` does not depend on the network / API being up by default.

Tickers the API does not have return HTTP 404
(`{"detail":"Equity file not found"}`); the prefetch script logs and skips them.
