# PRD — "Screener-Lite" Frontend
**Project codename:** `dev/` (Reliance + Industry Browser)
**Audience:** A frontend engineer building this from zero.
**Goal:** Ship a polished, production-quality web frontend that exposes the data already prepared in this repo as a fully browsable equity-research site, in the spirit of [screener.in](https://www.screener.in), but as **your own brand**.

---

## 0. TL;DR

We have two data assets sitting on disk:

1. **A taxonomy + listing of ~5,649 Indian companies** grouped under a 4-level industry tree (sector → group → industry → leaf), already exported as CSV (`category_wise/companies.csv`, `category_wise/industry_codes.csv`).
2. **A complete fundamental + price dataset for one stock (RELIANCE)** as a rich JSON (`stock_page/reliance.json`) plus a 498-row daily OHLCV CSV (`stock_page/reliance_chart_data.csv`).

A throwaway Python static-site generator (`category_wise/html_builder.py`, 759 lines) was used to validate the **category-browser flow** by emitting ~250 HTML pages into `category_wise/site/`. It is **reference-only** — the real product is a proper SPA / hybrid app.

**You are building the frontend for two surfaces:**

- **Surface A — Industry Browser** (the "Yellow Pages"): browse the industry tree, drill from sector → leaf, see paginated company tables, filter, sort, search.
- **Surface B — Stock Detail Page** (the "Reliance page"): for any company, render price header + interactive chart + key metrics + pros/cons + quarterly/annual financials + balance sheet + cash flows + ratios + shareholding + investor breakdown + documents.

Surface A and Surface B link to each other (companies in a table link to their stock page; stock pages link back to their leaf industry — the "categorisation backreference" called out in `category_wise/reference`).

The reference data only contains **one** stock (Reliance). The frontend MUST be built **generically** — i.e. data-driven from `<TICKER>.json` + `<TICKER>_chart_data.csv` — so adding more stocks later is purely a data drop.

---

## 1. Background, source-of-truth data, vocabulary

### 1.1 Data files (authoritative)

| File | Shape | Used by |
|---|---|---|
| `category_wise/industry_codes.csv` | 197 rows × 9 cols (CRLF). Header is literal `0,1,2,3,4,5,6,7,8`. Columns map to: `sector_code, sector_name, group_code, group_name, industry_code, industry_name, leaf_code, leaf_name, description`. | Industry tree. |
| `category_wise/companies.csv` | 5,649 rows × 24 cols. | Listing rows on every industry page; also the source-of-truth list of tickers. |
| `stock_page/reliance.json` | 3,754 LOC nested JSON. | All non-price content of the stock page. |
| `stock_page/reliance_chart_data.csv` | 498 rows: `Date,Open,High,Low,Close,Volume` covering ~24 months (2024-05-22 … 2026-05-21). | Price chart + hover tooltip. |

### 1.2 Industry hierarchy

4 levels with strict code prefixes:

```
sector_code   IN01 .. IN12          (12 sectors)     e.g. IN06  Healthcare
group_code    IN0101 ..             (16 groups)      e.g. IN0601 Healthcare
industry_code IN010101 ..           (59 industries)  e.g. IN060101 Pharmaceuticals & Biotechnology
leaf_code     IN010101001 ..        (197 leaves)     e.g. IN060101001 Pharmaceuticals
```

Each company in `companies.csv` carries all four `(code, name)` pairs already denormalized — you do **not** need to join on disk; you can render the breadcrumb straight from the company row.

The 12 top sectors are: **Commodities, Consumer Discretionary, Energy, Fast Moving Consumer Goods, Financial Services, Healthcare, Industrials, Information Technology, Services, Telecommunication, Utilities, Diversified.** Note: a handful of sector names in the CSV contain stray suffixes (e.g. `"Consumer Discretionary IN0201"`) and embedded newlines (e.g. `"Fast Moving Consumer \nGoods"`); the frontend must **normalize** these (trim, collapse whitespace, strip trailing `INxxxx` tokens) before display.

### 1.3 `companies.csv` column dictionary

| Column | Type | Notes / display rules |
|---|---|---|
| `S.No.` | float-as-int | Display as integer with trailing dot, e.g. `1.` Re-number on the client per page slice — do not trust the CSV value when you sort/filter. |
| `Company Code` | string | NSE/BSE-style ticker; **primary key** for the stock page. Drives the URL `/company/<CompanyCode>/`. |
| `Name` | string | Display name. May contain dots, ampersands. Clicking it goes to the stock page. |
| `CMPRs.` | float | "Current Market Price" in INR. Render with `₹` prefix, 2-dp, thousands grouping (Indian system — see §6.4). Column header should be relabeled `CMP ₹`. |
| `P/E` | float | Price/Earnings ratio, 1–2 dp. Blank when negative-earnings — show `—`. |
| `Mar CapRs.Cr.` | float | Market cap in ₹ crore. Relabel `Mkt Cap ₹Cr.` Render as integer with Indian grouping. |
| `Div Yld%` | float | Dividend yield. Append `%`. |
| `NP QtrRs.Cr.` | float | Net profit, latest reported quarter, ₹ crore. Relabel `NP Qtr ₹Cr.` |
| `Qtr Profit Var%` | float | YoY % change in NP. Color +green / −red, append `%`. |
| `Sales QtrRs.Cr.` | float | Quarterly sales, ₹ crore. Relabel `Sales Qtr ₹Cr.` |
| `Qtr Sales Var%` | float | YoY % change in sales. Color +/−. |
| `ROCE%` | float | Return on capital employed. Append `%`. |
| `sector_code … leaf_name` | string | Drive the breadcrumb without a join. |
| `description` | string | Short leaf-level description; surface as a hover tooltip on the breadcrumb leaf, or as a sub-heading on the leaf landing page. |
| `_scrape_page, _scrape_url, _scraped_at` | meta | **Never displayed.** Strip in ingestion. |

Column-class display tiers (preserved from `html_builder.py:60`):

- **core** (always visible, including mobile): `Name`, `CMP ₹`, `Mkt Cap ₹Cr.`, `Sales Qtr ₹Cr.`
- **optional** (hidden < 720 px): `P/E`, `Qtr Profit Var%`, `Qtr Sales Var%`
- **extended** (hidden < 900 px): `Div Yld%`, `NP Qtr ₹Cr.`, `ROCE%`
- **rownum**: `S.No.`

### 1.4 `reliance.json` schema (generic stock JSON)

Top-level keys (treat **all** as required; missing → render an empty-state block, not crash):

```jsonc
{
  "ticker": "RELIANCE",
  "url": "https://www.screener.in/company/RELIANCE/",        // source URL
  "overview": {
    "company_name": "Reliance Industries Ltd",
    "current_price": "18,38,666",                            // STRING, Indian-grouped, no ₹
    "about": ""                                              // long company description; may be empty
  },
  "key_metrics": {                                           // exactly 9 keys for Reliance — treat as open dict
    "Market Cap": "₹ 18,38,666 Cr.",
    "Current Price": "₹ 1,359",
    "High / Low": "₹ 1,612 / 1,290",
    "Stock P/E": "41.9",
    "Book Value": "₹ 418",
    "Dividend Yield": "0.41 %",
    "ROCE": "7.89 %",
    "ROE": "7.91 %",
    "Face Value": "₹ 10.0"
  },
  "pros_cons": {
    "pros": ["…"],
    "cons": ["…"]
  },
  "quarterly":     [ /* table rows, see §1.4.1 */ ],
  "profit_loss":   [ /* same shape */ ],
  "balance_sheet": [ /* same shape, no `expandable` */ ],
  "cash_flows":    [ /* same shape */ ],
  "ratios":        [ /* same shape */ ],
  "shareholding": {
    "table_1": [ /* quarterly shareholding rows */ ],
    "table_2": [ /* yearly shareholding rows  */ ]
  },
  "investors": {
    "quarterly": {
      "promoters":            { "<Holder name>": { "<Period>": "<pct>" } },
      "foreign_institutions": { … },
      "domestic_institutions":{ … },
      "government":           { … },
      "public":               { … }
    },
    "yearly": { /* same five buckets */ }
  },
  "documents": {
    "announcements":  [ { "title": "...", "url": "https://…pdf" } ],
    "annual_reports": [ { "title": "Financial Year 2025 from bse", "url": "…pdf" } ],
    "credit_ratings": [ { "title": "...", "url": "…pdf" } ],
    "concalls":       [ { "title": "...", "url": "…" } ]      // may be empty
  }
}
```

#### 1.4.1 Financial-table row shape (`quarterly`, `profit_loss`, `cash_flows`, `ratios`)

Each list is **header-row-first**. Index 0 looks like:

```jsonc
{ "": "", "Mar 2023": "Mar 2023", "Jun 2023": "Jun 2023", … }
```

Treat row[0] as the **column order**; collect column keys in iteration order (Python dict order is preserved in the JSON we have). Skip the empty `""` key for display.

Every subsequent row:

```jsonc
{
  "": "Sales",                  // row label
  "Mar 2023": "129,674",        // value as STRING, Indian-grouped, may carry "%" suffix
  "Jun 2023": "122,627",
  …
  "expandable": true,           // optional — see below
  "children": [                 // present iff expandable
     { "": "YOY Sales Growth %", "Mar 2023": "0.15%", … }
  ]
}
```

Rendering rules:

- Row label lives in the `""` key — **rename** to `label` in your normalized model.
- All numeric cells are **strings with Indian comma grouping** (`"1,38,666"` not `"138666"`). When you need to colour or chart them, parse: strip `%`, strip commas, treat parens as negative if any (none in this sample, but defensive).
- Negative percentages start with `-` (e.g. `"-16.28%"`). Color red.
- `expandable: true` → render a chevron; clicking expands to show `children` rows beneath, indented one level. Children themselves may not nest further in current data, but design the component recursively.
- `balance_sheet` rows do **not** have `expandable`/`children` — they are flat.

#### 1.4.2 `shareholding`

`table_1` is quarterly (Jun 2023 → Mar 2026), `table_2` is yearly. Same row shape as financial tables. Top-level rows are: `Promoters`, `FIIs`, `DIIs`, `Government`, `Public`, `No. of Shareholders`. The first 5 are `expandable` and their drill-down lives separately in `investors.quarterly.*` / `investors.yearly.*`.

#### 1.4.3 `investors.quarterly.<bucket>` and `.yearly.<bucket>`

Map of `holder_name → { period → percent_string }`. Periods are not guaranteed to be the same length per holder (newly entered/exited holders have partial series). Render as a table with `holder` as the row label; show `—` for missing periods. Sort holders **descending by most-recent period value** by default; allow click-to-sort by any period.

#### 1.4.4 `documents.*`

Each entry is `{title, url}`. URLs go to PDFs hosted on `bseindia.com` / `nseindia.com` / `screener.in`. The `title` of an announcement often embeds the age (`"… 1d - …"`) and the body summary; render with the title text unchanged, but **open in a new tab** with `rel="noopener noreferrer"`.

### 1.5 `<TICKER>_chart_data.csv`

`Date, Open, High, Low, Close, Volume`. Dates are ISO. The chart only needs `Date, Close, Volume` (per `stock_page/reference.txt`). Range: trailing ~2 years; **don't assume** exactly N rows.

---

## 2. Information architecture & routes

| # | Route | Page | Source |
|---|---|---|---|
| R1 | `/` | Home / landing | `industry_codes.csv` (sectors) + `companies.csv` (top movers, hand-picked indices) |
| R2 | `/market/` | Industry index (all 12 sectors as cards) | `industry_codes.csv` |
| R3 | `/market/<sector>/` | Sector page (e.g. `/market/IN06/`) | tree + companies@sector |
| R4 | `/market/<sector>/<group>/` | Group page | tree + companies@group |
| R5 | `/market/<sector>/<group>/<industry>/` | Industry page | tree + companies@industry |
| R6 | `/market/<sector>/<group>/<industry>/<leaf>/` | Leaf page (deepest) | tree + companies@leaf |
| R7 | `/market/.../page/<n>/` | Pagination of any R3–R6 | same |
| R8 | `/company/<code>/` | Stock detail page | `<code>.json` + `<code>_chart_data.csv` |
| R9 | `/search?q=…` | Global search (tickers + names + industries) | client-side index |
| R10 | `/screener` *(stretch)* | Filter builder over `companies.csv` | client-side |
| R11 | `/about` | Static | — |

The path scheme on R3–R6 is `/market/<sector_code>/<group_code>/<industry_code>/<leaf_code>/` using the **codes**, not the names (matches `category_wise/site/`). Names appear in breadcrumbs and headings only. Page numbers > 1 land under `/page/<n>/`; page 1 is the canonical URL with no `/page/` segment.

**Backreference (called out in `category_wise/reference`):** the stock page (R8) MUST display the full breadcrumb (`Industries / <sector> / <group> / <industry> / <leaf>`) using the company's denormalized industry columns, each segment a link back to R3–R6. This is the missing link from the prototype.

---

## 3. Surface A — Industry Browser

### 3.1 R1: Home

Visual: hero band ("Indian Equities, Categorised") + 12 sector tiles, 4 columns desktop / 2 mobile, each tile shows:

- Sector name (normalized).
- Company count (`companies.csv` filter by `sector_code`).
- A 3-up mini-list of largest companies in the sector by `Mar CapRs.Cr.`.
- Tile clicks → R3.

Below tiles, three rails (horizontally scrollable on mobile):

- **Top market cap (all India)** — top 10 by `Mar CapRs.Cr.`
- **Highest ROCE** — top 10 by `ROCE%` (only where positive, P/E exists)
- **Fastest profit growth** — top 10 by `Qtr Profit Var%`

A search bar (R9) is pinned in the topbar — always present.

### 3.2 R2: `/market/` — All sectors

A grid of 12 cards; each links to R3. Includes a depth-2 quick jump (click "Industries (197)" to a flat list).

### 3.3 R3–R6: Node pages

Page composition (see also `category_wise/templates/market_page.html` for the prototype's shape):

1. **Topbar** (global): brand, primary nav, search, theme toggle.
2. **Breadcrumb**: `Industries / Sector / Group / Industry / Leaf` — every crumb except the current is a link.
3. **Hero card**:
   - H1 = `<Node name> Companies`
   - Sub-line = `<total_count> companies` (use § thin-space + Indian grouping).
   - Leaf node only: render the `description` (from `industry_codes.csv`) as a 2-line paragraph below the count.
   - Right-aligned **"Browse subcategories"** dropdown listing direct children with their company counts (matches the prototype's `<details>` element but redo as a proper accessible Popover/Menu).
4. **Toolbar**:
   - Left: a "path label" pill repeating the breadcrumb text (matches prototype, optional in your design).
   - Right: column-visibility toggle, sort dropdown (default `Mar CapRs.Cr.` desc), CSV-export button.
5. **Company table** — see §3.5.
6. **Pagination** — see §3.6.

The hero, toolbar, table, and pagination live inside one rounded "card" container (visual identity from the prototype is fine to inherit, but you are free to rebrand — see §6).

### 3.4 Children dropdown

A node's "children" = the immediate next level in the hierarchy. Render with **count badges** next to each child name. If `node.depth == 4` (leaf), the dropdown is hidden.

### 3.5 Company table

| Requirement | Detail |
|---|---|
| Density | 25 rows / page on desktop (matches prototype `PAGE_SIZE = 25`), 10 on mobile. |
| Sticky header | Yes, on scroll within the table container. |
| Row striping | Even rows have a subtle tint. |
| Row hover | Tinted background + cursor pointer (whole row clickable to stock page; keyboard `Enter` opens). |
| Sort | Click any header to sort asc / desc / none. Multi-sort with shift-click (stretch). Default sort: `Mar CapRs.Cr.` desc. |
| Inline filter | Per-column quick filter row (numeric ranges for numeric columns, text contains for `Name`). Toggleable. |
| Selection | Optional multi-select with a top "Compare" button (stretch; opens `/compare?codes=A,B,C`). |
| Right-align numerics | Yes. Left-align `S.No.` and `Name`. |
| Cell formatting | See §6.4. |
| Color rules | `Qtr Profit Var%` and `Qtr Sales Var%`: green if > 0, red if < 0, muted if 0 / blank. |
| Empty state | `<h2>No companies available</h2><p>No companies found for this category.</p>` — matches the prototype. |
| Mobile collapse | Hide `col-extended` <900 px and `col-optional` <720 px (see §1.3). |
| Horizontal scroll | If still overflowing on mobile, allow native horizontal scroll inside the card. |
| Row click target | Whole `<tr>` is a link. Keyboard focus must land on the row, not individual cells. |

### 3.6 Pagination

- Show `Previous / 1 / … / N / Next`, with a window of ±2 around current (matches `pagination_numbers()` in `html_builder.py:428`).
- Page state is in the URL (`/page/<n>/`); back/forward must work.
- Show `<total_count> companies · Showing X–Y` on the left of the pagination row.

### 3.7 R9 — Global search

- Client-side fuzzy match over `(Name, Company Code, sector_name, group_name, industry_name, leaf_name)`.
- Use a prebuilt index (Lunr / MiniSearch / Fuse) built at app start; size ≈ 5.6k records.
- Keyboard: `Cmd/Ctrl+K` opens, `↑↓` navigates, `Enter` selects.
- Results grouped:
  - **Companies** (top 8) → R8.
  - **Industries** (top 5) → R3–R6.
- Recent searches stored in `localStorage`.

---

## 4. Surface B — Stock Detail Page (R8 `/company/<code>/`)

Order of blocks (vertical stack on mobile; right rail on desktop ≥1100 px):

### 4.1 Header / price strip (matches `stock_page/price.png`)

- Left: company name (`overview.company_name`), ticker badge (`ticker`), industry chip (clickable, opens leaf page) — backref per §2.
- Right: **NSE / BSE toggle pill** (two-state). The data only contains one number, so derive BSE = `nse_price + 0.45` and BSE change = `nse_change + 0.05` (or similar trivial offset — keep deterministic) so the toggle feels alive; document this as a placeholder. Per `stock_page/reference.txt`: hardcode the price, just make the toggle work.
- Big price line: `₹ <current_price>` (from `overview.current_price`, already Indian-grouped).
- Day change: `+<abs> (+<pct>%)` colored green if up, red if down. Derive from the chart CSV's last two rows (`Close[-1] - Close[-2]`).
- Tiny line: "as of <date> · NSE" using last CSV date.
- A "Follow" button (no-op for now) and a copy-link button.

### 4.2 Chart block (matches `stock_page/charts.png`)

- Plot **Close only**, line chart, no candles, no OHLCV (per `reference.txt`).
- Time-range toggle pill: **1D / 1W / 1M / 6M / YTD** (per `reference.txt`). Range filter is purely client-side over the CSV.
   - `1D` = last 1 trading day; degenerate single-point case — render as a flat tile showing latest close + day change, not a line.
   - `1W` = last 5 trading days.
   - `1M` = last ~22 trading days.
   - `6M` = last ~126 trading days.
   - `YTD` = rows where `Date >= jan_1_current_year`.
   - **Add** an `ALL` option too (full CSV) — useful given we have 2 yrs of data.
- Hover crosshair shows: `Date, Close (₹), Volume (Indian-grouped)`. Per `reference.txt`: volume shown only on hover.
- Brushing/zoom: stretch goal.
- Library: **Recharts** or **Lightweight-Charts** (TradingView open-source). Avoid Chart.js for line+crosshair UX — Lightweight-Charts is recommended (it's what the prototype CSS hints at: `chart.2a4531d22d97.js`).
- Color: green if `Close[last] > Close[first]` over the visible range; red otherwise. Area-fill at 8 % opacity.

### 4.3 Key metrics grid

Render `key_metrics` (9 entries for Reliance) as a 3×3 grid (or 2 col on mobile). Each tile: small label, big value. Do **not** parse the values — they ship pre-formatted.

### 4.4 Pros & cons

Two columns. Pros: green check icon, soft-green background. Cons: amber warning icon, soft-amber background. Bullets verbatim from JSON.

### 4.5 About

`overview.about` rendered as plain text with "Read more" if > 6 lines. Empty in this data file — show nothing (no empty box).

### 4.6 Financial tables — `quarterly`, `profit_loss`, `cash_flows`, `ratios`

One reusable `<FinancialTable>` component, driven by §1.4.1's contract. Features:

- Header row pinned; first column ("label") sticky horizontally.
- Right-align numerics.
- Indent + chevron for `expandable: true`; expanding shows `children`. Animate height ~150 ms.
- Toggle to show **% YoY** computed in-component (where the row is e.g. `Sales` and a child `YOY Sales Growth %` exists, surface both).
- Mini-sparkline next to the row label (stretch): a 10 × 22 px line of all values for that row.
- Horizontal scroll if columns overflow.

Each section is a collapsible accordion: titles `Quarterly Results`, `Profit & Loss`, `Balance Sheet`, `Cash Flows`, `Ratios`. Default state: Quarterly expanded, others collapsed.

### 4.7 Shareholding

Top: bar chart of latest period for `Promoters / FIIs / DIIs / Government / Public` (single horizontal stacked bar 100 %). Hover shows pct + delta vs previous period.

Then **two `<FinancialTable>` instances**: `shareholding.table_1` (quarterly) and `shareholding.table_2` (yearly), with the standard expand/collapse. When a top-level row (e.g. `FIIs`) is expanded, hop into `investors.quarterly.foreign_institutions` and render holders as `children`.

Buckets-to-table-key map:

| Top row | `investors` bucket |
|---|---|
| Promoters | `promoters` |
| FIIs | `foreign_institutions` |
| DIIs | `domestic_institutions` |
| Government | `government` |
| Public | `public` |

If the bucket is empty for a period, the expanded view should still render the parent row's totals plus an empty-state line "No holder breakdown available for this period".

### 4.8 Documents

Tabs: `Announcements / Annual Reports / Credit Ratings / Concalls`. Inside each tab: list of `{title, url}` with a PDF icon and a small chip showing the host (`bseindia.com`, `nseindia.com`, etc., parsed from URL). Empty tabs show an empty state — Reliance has 0 `concalls`.

### 4.9 Peer companies (stretch, recommended)

At the bottom of the stock page, show 5 peer rows from `companies.csv` filtered by the same `leaf_code`, sorted by `Mar CapRs.Cr.` desc, excluding the current ticker. Reuses the §3.5 table component. Links to siblings build cross-page graph.

---

## 5. Data layer & build

### 5.1 Static-first

Default the project to a **static export** (Next.js `output: 'export'` or Astro). Reasons:

- The dataset is finite and changes maybe daily.
- Every page is fully renderable at build time.
- Matches the existing `html_builder.py` philosophy.

Per build:

1. Parse `industry_codes.csv` → tree JSON.
2. Parse `companies.csv` → 5,649 records → bucket by `(sector, group, industry, leaf)` → emit one prerendered page per node and per page-number (≈ 250 node pages today; will grow with leaf depth).
3. For each `<TICKER>.json + <TICKER>_chart_data.csv` present in `data/stocks/`, emit `/company/<ticker>/`.
4. Emit a single `index.json` for the global search containing `{code, name, sector, leaf}` × 5,649.

### 5.2 Recommended stack

- **Framework:** Next.js 15 App Router with `output: 'export'`. (Astro is a valid alt — pick one and stick to it.)
- **Language:** TypeScript strict.
- **Styling:** Tailwind v4 + a small CSS file for typography. The prototype's warm-paper palette (`#f6f3ec`, ink `#22201c`, accent `#2d6a4f`) is a perfectly fine default — keep it unless you intentionally rebrand.
- **Charts:** `lightweight-charts` (TradingView) or `recharts`.
- **Tables:** `@tanstack/react-table` (headless, sort/filter/pagination).
- **Search:** `minisearch`.
- **Icons:** `lucide-react`.
- **State:** URL is the state. No Redux. `nuqs` for typed URL params.
- **Testing:** Vitest + Playwright for one end-to-end smoke (homepage → R6 → R8).

### 5.3 Data ingestion library

Create a `lib/data/` module with these pure functions (unit-tested):

```ts
parseIndustryCsv(raw: string): IndustryTree;
parseCompaniesCsv(raw: string): Company[];
parseStockJson(raw: string): Stock;
parseStockOhlcv(raw: string): PricePoint[];
formatIndianNumber(n: number, opts?: {dp?: number, prefix?: string, suffix?: string}): string;
parseNumericCell(value: string): number | null;        // strips ₹, commas, %, parens
normalizeSectorName(raw: string): string;              // fixes the IN02xxxx suffix issue
```

Treat all parsing as **lenient** — never throw on bad rows; surface a debug warning instead.

### 5.4 Type contracts (sketch — fill in)

```ts
type IndustryNode = {
  code: string;
  name: string;
  depth: 1 | 2 | 3 | 4;
  path: string[];      // ["IN06","IN0601","IN060101","IN060101001"]
  names: string[];     // ["Healthcare","Healthcare","Pharma…","Pharmaceuticals"]
  description?: string;     // only depth=4
  children: IndustryNode[];
};

type Company = {
  code: string;        // "RELIANCE"
  name: string;
  cmp: number | null;
  pe: number | null;
  marketCapCr: number | null;
  divYieldPct: number | null;
  npQtrCr: number | null;
  profitVarPct: number | null;
  salesQtrCr: number | null;
  salesVarPct: number | null;
  rocePct: number | null;
  sector: { code: string; name: string };
  group:  { code: string; name: string };
  industry: { code: string; name: string };
  leaf:    { code: string; name: string };
  description: string;
};

type FinRow = {
  label: string;
  values: Record<string, string>;   // period -> raw cell
  expandable?: boolean;
  children?: FinRow[];
};

type Stock = {
  ticker: string;
  sourceUrl: string;
  overview: { companyName: string; currentPriceRaw: string; about: string };
  keyMetrics: Record<string, string>;
  prosCons: { pros: string[]; cons: string[] };
  quarterly: FinRow[];
  profitLoss: FinRow[];
  balanceSheet: FinRow[];
  cashFlows: FinRow[];
  ratios: FinRow[];
  shareholding: { quarterly: FinRow[]; yearly: FinRow[] };
  investors: {
    quarterly: Record<HolderBucket, Record<string, Record<string, string>>>;
    yearly:    Record<HolderBucket, Record<string, Record<string, string>>>;
  };
  documents: {
    announcements: DocLink[];
    annualReports: DocLink[];
    creditRatings: DocLink[];
    concalls: DocLink[];
  };
};
```

---

## 6. Visual & interaction system

### 6.1 Look-and-feel

Two acceptable directions — pick one in the design phase and commit:

- **(A) "Warm paper"** — inherit the prototype's palette (cream `#f6f3ec`, ink `#22201c`, deep-green accent `#2d6a4f`, serif typography Georgia/Charter). Distinct from Screener.in's clinical white. *Recommended* because it lets you avoid pixel-comparing to the reference.
- **(B) "Bloomberg dark"** — near-black background, neon green/red P&L coloring, monospace numerics. More obviously a "trading terminal" vibe.

Either way:

- **Numeric type** is monospaced tabular (e.g. `font-variant-numeric: tabular-nums`).
- All borders ≤ 1 px and ≤ 18 % opacity.
- Single elevation token (one shadow) — no shadow stacks.

### 6.2 Typography scale

- Display: 44/1.06, -0.045em letter-spacing (matches prototype H1).
- H1: 32, H2: 22, H3: 18, body: 15, caption: 13.
- Numerics in tables: 14, mono.

### 6.3 Color tokens (warm paper)

```
--bg: #f6f3ec    --card: #fffdf7   --ink: #22201c   --muted: #6f6a61
--line: #ded7c9  --stripe: #faf7ef --shadow: 0 20px 50px rgba(44,38,26,.10)
--accent: #2d6a4f  --accent-soft: #e3f0e8  --accent-strong: #1f4e39
--up: #16a34a     --up-soft: #dcfce7
--down: #dc2626   --down-soft: #fee2e2
```

### 6.4 Number formatting

- **Indian system** (`Intl.NumberFormat('en-IN')`) for every numeric value the user reads.
- ₹ symbol with a thin space, then the number, e.g. `₹ 18,38,666`.
- For market cap: append ` Cr.` (already in the source for stock page; add when rendering company table).
- For percentages: keep 1–2 dp, append ` %` with a thin space.
- Negatives: render with leading `−` (U+2212, not hyphen).
- Missing: render `—` (em-dash).

### 6.5 Accessibility

- WCAG 2.1 AA contrast.
- Every clickable row & chip is reachable by Tab; focus ring visible.
- Charts have an off-screen `<table>` mirror for screen readers.
- Color is never the only signal for P&L sign — also use `+ / −` glyphs.

### 6.6 Responsive breakpoints

| Token | Width | Behavior |
|---|---|---|
| `xs` | < 480 | Single column, smaller hero, table degrades to card-list. |
| `sm` | < 720 | Hide `col-optional` + `col-extended`. Nav becomes hamburger. |
| `md` | < 900 | Hide `col-extended`. Stock page right-rail collapses below. |
| `lg` | ≥ 1100 | Full layout; stock page uses 8/4 grid (content / right rail). |

---

## 7. Out-of-scope (v1) — but design for them

- Authentication / saved screens / watchlists.
- Real-time prices.
- Anything that isn't currently sourced from the files in this repo.
- Multi-currency / multi-region.
- Server-side persistence.

Adding more stocks later = drop `<TICKER>.json` + `<TICKER>_chart_data.csv` into `data/stocks/` and rebuild. No code changes.

---

## 8. Acceptance criteria

The frontend is "done" when:

1. **Build succeeds** producing a static export covering all 197 leaf pages + every intermediate node page + every paginated `/page/<n>/` slice + 1 stock page (RELIANCE).
2. **Industry browser** (Surface A): I can land on `/market/IN06/IN0601/IN060101/IN060101001/`, see ≥ 1 Reliance-style row, sort by Mkt Cap desc, jump to page 2, and click a company name to land on its stock page (R8).
3. **Backreference** (Surface B → A): From `/company/RELIANCE/`, the breadcrumb chips link back to each of the 4 industry levels.
4. **Stock page parity** with `reliance.json`: every top-level key is rendered somewhere on the page. Hidden empty arrays (e.g. `concalls`) show empty states, not blanks or crashes.
5. **Chart**: NSE/BSE toggle visible; chart switches 1D/1W/1M/6M/YTD/ALL; crosshair tooltip shows `Date · ₹ Close · Vol n`.
6. **Search** (R9): Cmd-K opens, typing "rel" surfaces RELIANCE in ≤ 50 ms on a 5,649-record index.
7. **Lighthouse**: ≥ 95 Performance, 100 Accessibility on `/market/IN06/`.
8. **No console errors** on any page in production build.

---

## 9. Open questions for the PM

1. **Brand identity** — keep prototype name "Industry Market" or rebrand? *(Default: rebrand. Suggest `Ledger`, `Sextant`, or `Tilewise`.)*
2. **Stock data update cadence** — how/when does new `<TICKER>.json` arrive? Affects whether ISR or pure static export is right.
3. **Compare / screener feature priority** — yes-in-v1 or push to v2?
4. **NSE vs BSE price source** — should we keep the deterministic-offset placeholder, or drop the toggle until we have real BSE data?
5. **Dark mode** — must-have or nice-to-have?
6. **Licensing of scraped Screener data** — confirm we can host this publicly.

---

## 10. Reference files in this repo (for the engineer)

- `category_wise/html_builder.py` — prior-art generator; copy column classes / pagination math / breadcrumb logic.
- `category_wise/templates/market_page.html` — page skeleton.
- `category_wise/templates/assets/market.css` — visual baseline (paper palette).
- `category_wise/site/` — actual rendered output for spot-checking.
- `category_wise/categories.png` — designer's intent for the categorisation backref.
- `category_wise/screener_reference_html.html` — Screener.in industry page reference.
- `stock_page/price.png` — designer's intent for §4.1 price strip.
- `stock_page/charts.png` — TradingView reference for §4.2 chart UX.
- `stock_page/screener_reference.html` + `screener_reference_files/` — Screener.in company page reference; do **not** lift their CSS verbatim, but it's useful to spot-check what fields exist.
- `stock_page/reference.txt` — original PM notes (the source of the price/chart requirements in §4.1–4.2).
- `category_wise/reference` — original PM notes (the source of the breadcrumb-backref requirement in §2).
