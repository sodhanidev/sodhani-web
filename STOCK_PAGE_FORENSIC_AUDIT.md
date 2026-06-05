# Individual Stock Page Forensic Data Audit

Audit date: 2026-06-05

Audited route: `/company/RELIANCE/`, rendered by `src/app/company/[code]/page.tsx` and `src/components/company/CompanyPageTemplate.tsx`.

Important scope note: the repository has no directory or file literally named `reference_data`. For this audit, `reference_data` means the repo-declared source corpus for the stock page:

- `stock_page/reliance.json`
- `stock_page/reliance_chart_data.csv`
- `category_wise/companies.csv`
- `category_wise/industry_codes.csv`

This audit verifies traceability to those files. It does not verify that those files match live market data or external filings.

## Executive Verdict

Overall assessment: **Source-Driven With Significant Issues**

No mock stock-data series was found on the main stock page. Most displayed company, financial, document, related-stock, ticker-tape, and chart values are traceable to the reference corpus. However, the page is not fully trustworthy as a strict source-driven financial artifact because:

- The stock body mixes multiple reference files that disagree on same-named values.
- EV/EBITDA assumes missing cash equals `0`.
- EV/EBITDA uses `Operating Profit` as EBITDA without disclosure.
- The debt chart advertises a cash-equivalents series although Reliance has no `Cash Equivalents` row in the loaded balance sheet.
- Footer/app chrome contains hardcoded visible values not sourced from reference data.
- Several chart axis/tick values are synthetic visualization values and should not be read as factual source datapoints.

Build verification: `npm run build` passes. The first sandboxed build failed only because Next.js could not fetch Google Fonts; rerunning with network access succeeded and statically generated `/company/RELIANCE/`.

## Source Traceability

| Pipeline Step | File / Function | Reference Data Fields | Notes |
| --- | --- | --- | --- |
| Route generation | `src/app/company/[code]/page.tsx` -> `generateStaticParams()` | available `stock_page/*.json` names | Only `RELIANCE` is generated. |
| Main model | `src/lib/data/company-template.ts:getCompanyPageModel()` | stock JSON, price CSV, company CSV, industry CSV | Combines the stock, price points, company row, peers, and industry P/E. |
| Stock JSON loader | `src/lib/data/stocks.ts:getStock()` | `ticker`, `overview`, `key_metrics`, tables, shareholding, investors, documents | Direct JSON fields are normalized into `Stock`. |
| Price CSV loader | `src/lib/data/stocks.ts:getPricePoints()` | `Date`, `Open`, `High`, `Low`, `Close`, `Volume` | Parses 497 price rows. |
| Company CSV loader | `src/lib/data/companies.ts:getCompanies()` | `Company Code`, `Name`, `CMPRs.`, `P/E`, `Mar CapRs.Cr.`, `Qtr Profit Var%`, taxonomy fields | Used for peers, ticker tape, industry P/E, and source category. |
| Stock page rendering | `src/components/company/CompanyPageTemplate.tsx` | model fields above | Builds page sections and key metrics. |

## Table 1: Direct Data Elements

Accuracy status values: `Exact`, `Potentially Modified`, `Unknown`.

| UI Element | Screen Location | Source Field(s) in reference_data | Transformation Applied | Accuracy Status |
| --- | --- | --- | --- | --- |
| Stock logo initial `R` | Header | `stock_page/reliance.json:ticker` | `ticker.slice(0, 1)` | Potentially Modified |
| Company name | Header | `overview.company_name` | string pass-through | Exact |
| Current price | Header | `key_metrics["Current Price"]`, fallback `overview.current_price` | parse currency string, format with 2 decimals | Potentially Modified |
| Market Cap | Key Metrics | `key_metrics["Market Cap"]` | trim only | Exact |
| Stock P/E | Key Metrics | `key_metrics["Stock P/E"]` | trim only | Exact |
| ROCE | Key Metrics | `key_metrics["ROCE"]` | trim only | Exact |
| ROE | Key Metrics | `key_metrics["ROE"]` | trim only | Exact |
| Dividend Yield | Key Metrics | `key_metrics["Dividend Yield"]` | trim only | Exact |
| No. of Shareholders | Key Metrics | `shareholding.table_1/Public/children/No. of Shareholders` latest period, fallback yearly table | latest-period lookup | Exact |
| Annual ratio periods | Ratios Snapshot, Annual mode | `ratios[0]` period keys | last 7 periods, reversed | Potentially Modified |
| Debtor Days | Ratios Snapshot, Annual mode | `ratios` row `Debtor Days`, last 7 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Inventory Days | Ratios Snapshot, Annual mode | `ratios` row `Inventory Days`, last 7 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Days Payable | Ratios Snapshot, Annual mode | `ratios` row `Days Payable`, last 7 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Cash Conversion Cycle | Ratios Snapshot, Annual mode | `ratios` row `Cash Conversion Cycle`, last 7 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Working Capital Days | Ratios Snapshot, Annual mode | `ratios` row `Working Capital Days`, last 7 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| ROCE % | Ratios Snapshot, Annual mode | `ratios` row `ROCE %`, last 7 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly periods | Ratios Snapshot, Quarterly mode | `quarterly[0]` period keys | last 8 periods, reversed | Potentially Modified |
| Quarterly Sales | Ratios Snapshot, Quarterly mode | `quarterly` row `Sales`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly Expenses | Ratios Snapshot, Quarterly mode | `quarterly` row `Expenses`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly Operating Profit | Ratios Snapshot, Quarterly mode | `quarterly` row `Operating Profit`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly OPM % | Ratios Snapshot, Quarterly mode | `quarterly` row `OPM %`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly Other Income | Ratios Snapshot, Quarterly mode | `quarterly` row `Other Income`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly Interest | Ratios Snapshot, Quarterly mode | `quarterly` row `Interest`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly Depreciation | Ratios Snapshot, Quarterly mode | `quarterly` row `Depreciation`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly Profit before tax | Ratios Snapshot, Quarterly mode | `quarterly` row `Profit before tax`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly Tax % | Ratios Snapshot, Quarterly mode | `quarterly` row `Tax %`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly Net Profit | Ratios Snapshot, Quarterly mode | `quarterly` row `Net Profit`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly EPS in Rs | Ratios Snapshot, Quarterly mode | `quarterly` row `EPS in Rs`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Quarterly Raw PDF | Ratios Snapshot, Quarterly mode | `quarterly` row `Raw PDF`, last 8 periods | direct cell pass-through, blanks become `-` | Potentially Modified |
| Pros list | Analysis | `pros_cons.pros[]` | direct string pass-through | Exact |
| Cons list | Analysis | `pros_cons.cons[]` | direct string pass-through | Exact |
| Financial performance revenue bars | Financial Performance, Performance chart | `profit_loss` or `quarterly` row `Sales` | parse numeric cells; latest 5 periods shown in current mode | Potentially Modified |
| Financial performance net income bars | Financial Performance, Performance chart | `profit_loss` or `quarterly` row `Net Profit` | parse numeric cells; latest 5 periods shown in current mode | Potentially Modified |
| Debt bars | Financial Performance, Debt chart | `balance_sheet` row `Borrowings` | parse numeric cells; latest 5 periods | Potentially Modified |
| Free cash flow bars | Financial Performance, Debt chart | `cash_flows` row `Free Cash Flow` | parse numeric cells; latest 5 periods | Potentially Modified |
| Shareholding period tabs | Shareholding Pattern | `shareholding.table_1[0]` period keys | latest 12 quarterly periods, compact display e.g. `Mar '26` | Potentially Modified |
| Promoters shareholding | Shareholding Pattern | `shareholding.table_1` row `Promoters` | parse percent, format to 2 decimals | Potentially Modified |
| FIIs shareholding | Shareholding Pattern | `shareholding.table_1` row `FIIs` | parse percent, label expanded in some places | Potentially Modified |
| DIIs shareholding | Shareholding Pattern | `shareholding.table_1` row `DIIs` | parse percent, label expanded in some places | Potentially Modified |
| Government shareholding | Shareholding Pattern | `shareholding.table_1` row `Government` | parse percent, format to 2 decimals | Potentially Modified |
| Public shareholding | Shareholding Pattern | `shareholding.table_1` row `Public` | parse percent, format to 2 decimals | Potentially Modified |
| Related-stock source category | Related Stocks | `category_wise/companies.csv` leaf node, `industry_codes.csv` node name | selected first peer-containing source node | Exact |
| Related stock company name | Related Stocks | peer `Name` from `category_wise/companies.csv` | cleaned display name | Potentially Modified |
| Related stock code | Related Stocks | peer `Company Code` | uppercase | Potentially Modified |
| Related stock CMP | Related Stocks | peer `CMPRs.` | parse numeric, format 2 decimals | Potentially Modified |
| Related stock percentage | Related Stocks | peer `Qtr Profit Var%` | parse numeric, format 2 decimals with sign | Potentially Modified |
| Document title | Documents | `documents.annual_reports[].title`, `documents.announcements[].title`, `documents.credit_ratings[].title` | direct string pass-through | Exact |
| Document URL | Documents | same document arrays `.url` | anchor href pass-through | Exact |
| Document host | Documents | document `.url` | `new URL(url).hostname`, strip leading `www.` | Exact |
| Ticker tape label | Shared top chrome | `category_wise/companies.csv` company code or initials from name | selects 16 companies, duplicates for marquee loop | Potentially Modified |
| Ticker tape price | Shared top chrome | `CMPRs.` | parse numeric, format 2 decimals | Potentially Modified |
| Ticker tape percentage | Shared top chrome | `Qtr Profit Var%` | absolute value, format 1 decimal; sign indicated by color/icon only | Potentially Modified |

## Table 2: Derived Data Elements

Accuracy classification values: `Exact Mathematical Derivation`, `Approximation`, `Heuristic Estimate`, `Fallback Calculation`, `Cannot Verify`.

| UI Element | Formula Used | Input Fields from reference_data | Derived Correctly? | Accuracy Classification |
| --- | --- | --- | --- | --- |
| Industry P/E | `sum(marketCapCr) / sum(marketCapCr / pe)` for first node among leaf, industry, group with at least 2 positive-P/E constituents | `category_wise/companies.csv`: peer `Mar CapRs.Cr.`, `P/E`; `industry_codes.csv` taxonomy | Yes. For Reliance leaf: 12 constituents, value 14.81. | Exact Mathematical Derivation |
| 52-week High / Low | `max(point.high) / min(point.low)` where point date >= latest price date minus 365 days | `reliance_chart_data.csv`: `Date`, `High`, `Low` | Yes. For Reliance: Rs 1,611.80 / Rs 1,290.00. | Exact Mathematical Derivation |
| No. of Shares | Preferred: `latest Equity Capital / Face Value`; fallback: `Market Cap / Current Price` | `balance_sheet` row `Equity Capital`, `key_metrics["Face Value"]`; fallback uses `key_metrics` | Current data uses preferred source and is reproducible. Fallback would be less reliable. | Exact Mathematical Derivation |
| Price chart visible range | `ALL = all rows`; `1D = last 2 rows`; `1W = last 5`; `1M = last 22`; `6M = last 126`; `1Y = last 252`; `YTD = rows date >= latest year Jan 1` | `reliance_chart_data.csv` | Reproducible, but ranges are trading-row approximations except YTD. | Approximation |
| Price chart High | `max(visible.high)` | `reliance_chart_data.csv:High` | Yes | Exact Mathematical Derivation |
| Price chart Low | `min(visible.low)` | `reliance_chart_data.csv:Low` | Yes | Exact Mathematical Derivation |
| Price chart Returns | `((latestClose - firstClose) / firstClose) * 100` | `reliance_chart_data.csv:Close` | Yes | Exact Mathematical Derivation |
| Price line/area coordinates | `x = index/(n-1)` scaled to chart width; `y = (close - minClose)/(maxClose - minClose)` scaled to chart height | `reliance_chart_data.csv:Close` | Yes. Coordinates are visual transforms, not extra data. | Exact Mathematical Derivation |
| Price chart y-axis ticks | `minClose + (span / 3) * index`, reversed | `Close` min/max | Yes, but synthetic tick values. | Heuristic Estimate |
| Tooltip timestamp | `format(date) + " 15:30 IST"` | CSV `Date` only | Date is sourced; time is hardcoded. | Fallback Calculation |
| Sales & margin chart Sales | selected `Sales` values, latest range subset | `quarterly` or `profit_loss` row `Sales` | Yes | Exact Mathematical Derivation |
| Sales & margin chart Net Profit | selected `Net Profit` values, latest range subset | `quarterly` or `profit_loss` row `Net Profit` | Yes | Exact Mathematical Derivation |
| Sales & margin chart Net Margin | `(Net Profit / Sales) * 100` when sales > 0, else 0 | same rows | Formula is valid; zero fallback on nonpositive sales is a display fallback. | Exact Mathematical Derivation |
| Sales growth | `((latestSales - previousSales) / abs(previousSales)) * 100` | Sales chart points | Yes | Exact Mathematical Derivation |
| Sales & margin chart axes | Sales axis max = raw max * 1.08; margin padding = max(1, span * 0.22) | Sales, Net Profit, Net Margin | Reproducible but visual padding is synthetic. | Heuristic Estimate |
| Valuation market cap | `dailyClose * sharesOutstandingCr`, where `sharesOutstandingCr = Equity Capital / Face Value` | price CSV close; balance sheet `Equity Capital`; `Face Value` | Yes, source-derived. | Exact Mathematical Derivation |
| Enterprise value | `marketCap + Borrowings - Cash` | Market cap derivation; balance sheet `Borrowings`; intended `Cash Equivalents` | Current Reliance data has no cash row, so code uses cash = 0. | Fallback Calculation |
| EV/EBITDA | `(marketCap + Borrowings - Cash) / TTM Operating Profit` | Valuation market cap, borrowings, missing cash, quarterly `Operating Profit` TTM | Reproducible but not fully source-backed because cash is missing and operating profit is used as EBITDA. | Cannot Verify |
| Price to Book | `marketCap / (Equity Capital + Reserves)` | price CSV close, balance sheet `Equity Capital`, `Reserves`, key metric `Face Value` | Yes, with latest historical balance period applied until next period. | Exact Mathematical Derivation |
| Market Cap / Sales | `marketCap / TTM Sales` | price CSV close; quarterly `Sales` TTM; balance sheet `Equity Capital`; `Face Value` | Yes, with latest historical financial basis applied until next period. | Exact Mathematical Derivation |
| Valuation basis | latest financial period end date `<= price date`; quarterly TTM preferred, annual fallback | quarterly/profit_loss/balance_sheet period keys | Reproducible but basis is forward-filled between reporting dates. | Approximation |
| Valuation chart change | `((latestRatio - previousRatio) / abs(previousRatio)) * 100` | derived valuation series | Yes | Exact Mathematical Derivation |
| Valuation chart axes | ratio padding = `max(0.1, span * 0.15)`; market cap axis = 0..max | derived valuation series | Reproducible but synthetic. | Heuristic Estimate |
| Financial Performance net margin | `(Net Profit / Sales) * 100` | profit_loss or quarterly rows | Yes | Exact Mathematical Derivation |
| Financial Performance chart scale | value max/min padded by 10%; line max/min padded by 18% | selected financial rows | Reproducible but synthetic axis values. | Heuristic Estimate |
| Debt chart bar scale | selected debt/free-cash-flow values, padded by 10% | balance_sheet `Borrowings`, cash_flows `Free Cash Flow` | Yes for present series. | Heuristic Estimate |
| Shareholding donut slices | `dash = (holderPct / sum(holderPct)) * usableCircumference`; offsets accumulate prior slices | shareholding table percentages | Yes; values displayed remain original percentages, geometry normalized by total. | Exact Mathematical Derivation |
| Related-stock initial | first alphanumeric character from peer name, fallback first code character, fallback `S` | peer name/code | Yes | Fallback Calculation |
| Related-stock selection | first non-empty node among leaf, industry, group; sort by market cap desc; exclude current ticker; slice 10 | company CSV market cap and taxonomy | Yes | Exact Mathematical Derivation |
| Ticker-tape selection | eligible rows with CMP, profit variation, market cap; movers abs profit variation 2..15 sorted by abs variation then market cap; two flat rows; duplicated loop | company CSV | Yes, but ticker percentage is not price change. | Exact Mathematical Derivation |
| Document visible set | default group = first non-empty group; show first 12 unless expanded | document arrays in JSON | Yes | Exact Mathematical Derivation |
| Document host | `new URL(url).hostname.replace(/^www\\./, "")`, fallback `external` | document URL | Yes for valid URLs. | Exact Mathematical Derivation |

## Table 3: Problematic Elements

| UI Element | Issue Type | Evidence | Severity |
| --- | --- | --- | --- |
| Named `reference_data` source | Missing Source | No `reference_data` path exists. The app uses `stock_page` and `category_wise` as the effective source corpus. | Low |
| Header fallback price | Data Drift Risk | `overview.current_price` is `18,38,666`, while `key_metrics["Current Price"]` is `Rs 1,359`; header currently prefers key metric, but fallback would display a market-cap-looking value as price. | High |
| Same-named metrics across files | Inconsistent Calculation | Stock JSON says Current Price `Rs 1,359`, Market Cap `Rs 18,38,666 Cr.`, Stock P/E `41.9`, ROCE `7.89%`; company CSV row says CMP `1431.55`, Market Cap `1937250.03`, P/E `24.01`, ROCE `10.48`. Chart latest close is `1349.6`. | High |
| EV/EBITDA chart | Missing Source | Balance sheet has no `Cash Equivalents` row, but EV formula uses `parseNumericCell(cashRow?.values[period]) ?? 0`. | High |
| EV/EBITDA chart | Approximation Presented As Exact | Label says EV/EBITDA, but denominator is `Operating Profit` or `EBITDA` row lookup. Reliance data supplies `Operating Profit`; no explicit EBITDA row was found. | High |
| Valuation charts | Fallback Calculation | `Face Value` falls back to literal `10` if source is missing. Current Reliance data has `Face Value`, so this is a future data drift risk, not current output failure. | Medium |
| Valuation charts | Approximation Presented As Exact | Daily valuation ratios use latest historical balance/income basis forward-filled until the next period end. UI does not disclose this basis except hover `Basis`. | Medium |
| Debt level and coverage chart | Missing Source | Legend/help advertise `Cash & equivalents`; Reliance balance sheet lacks a matching row, so the series renders with null/zero-height bars and accessibility labels can say `not available`. | Medium |
| Related-stock percentage | Unknown Origin | UI class names and visual treatment call it stock `change`, but source is `Qtr Profit Var%`, not price return. The card itself does not disclose that. | Medium |
| Ticker-tape percentage | Data Drift Risk | Source is `Qtr Profit Var%`; top-level aria label discloses this, but ticker-like visual can be mistaken for market price movement. | Low |
| Price tooltip time | Hardcoded Value | Tooltip appends `15:30 IST` from code; CSV only contains date, not time. | Low |
| Chart axis labels | Heuristic Estimate | Price, sales, valuation, and financial-performance axes contain generated tick values from padded scales, not source datapoints. | Low |
| Footer year range and app links | Hardcoded Value | `Sodhani Capital 2009-2025`, App Store/Google Play links, provider copy are hardcoded in `SiteFooter`, outside reference corpus. | Low |
| Missing industry chip on header | Missing Source | `StockHeader` can render `company.leaf.name`, but `CompanyPageTemplate` calls it without `company`, so the PRD-required industry chip is absent. This is a missing element, not an untraceable displayed value. | Medium |

## Chart Verification

| Chart | Source Data | Transformation Pipeline | Accuracy |
| --- | --- | --- | --- |
| Stock price chart | 497 rows from `stock_page/reliance_chart_data.csv`: `Date`, `Open`, `High`, `Low`, `Close`, `Volume` | Range filter -> close line coordinates -> high/low/return summary -> tooltip from date/close. No smoothing or interpolation of close values. Axis ticks are generated. | Exact for plotted close/high/low/volume values; synthetic axis ticks; tooltip time hardcoded. |
| Sales & margin chart in `StockChart` | `quarterly` rows `Sales`, `Net Profit`, periods | Select latest range subset -> bars for sales/net profit -> net margin line `(netProfit / sales) * 100` -> sales growth from latest two sales points. | Exact direct bars and exact margin/growth formulas; axis padding heuristic. |
| EV/EBITDA chart | price CSV close; balance sheet `Equity Capital`, `Reserves`, `Borrowings`; key metric `Face Value`; quarterly `Sales`, `Operating Profit`; missing `Cash Equivalents` | Build balance bases by annual period; build quarterly TTM income bases; for each price point use latest basis with period end <= date; market cap = close * shares; EV = market cap + borrowings - cash; ratio = EV / operating profit. | Forward-filled accounting basis; EV cash component is fallback `0`; denominator is operating profit, so cannot verify true EV/EBITDA. |
| Price to Book chart | price CSV close; balance sheet `Equity Capital`, `Reserves`; key metric `Face Value` | Same basis selection; market cap = close * shares; book value = equity capital + reserves; ratio = market cap / book value. | Exact formula from available fields, with forward-filled balance-sheet basis. |
| Market Cap / Sales chart | price CSV close; balance sheet `Equity Capital`; key metric `Face Value`; quarterly `Sales` TTM | Same basis selection; market cap = close * shares; sales = latest TTM quarterly sales; ratio = market cap / sales. | Exact formula from available fields, with forward-filled income basis. |
| Financial Performance mini chart | `profit_loss` or `quarterly` rows `Sales`, `Net Profit` | Latest 5 periods in active mode; bars for source values; net margin line = net profit / sales; axes padded. | Exact source bars and exact margin formula; no interpolation; synthetic axes. |
| Debt level and coverage mini chart | `balance_sheet` row `Borrowings`; `cash_flows` row `Free Cash Flow`; intended `balance_sheet` row `Cash Equivalents` missing | Latest 5 annual balance periods; bars for debt/free cash flow; missing cash equivalents becomes null/zero-height. | Exact for present debt and FCF values; cash-equivalents series missing. |
| Shareholding donut/bar chart | `shareholding.table_1` rows `Promoters`, `FIIs`, `DIIs`, `Government`, `Public` | Latest 12 periods exposed as tabs; selected period defaults latest; percentages parsed and displayed; donut geometry normalized by total. | Exact displayed percentages; geometry normalized, no smoothing/interpolation. |

## Accuracy Assessment By Metric

| Metric / UI Value | Classification |
| --- | --- |
| Header company name | 100% Exact |
| Header current price | Exact but dependent on source quality |
| Header logo initial | Exact but dependent on source quality |
| Market Cap card | Exact but dependent on source quality |
| Stock P/E card | Exact but dependent on source quality |
| ROCE card | Exact but dependent on source quality |
| ROE card | Exact but dependent on source quality |
| Dividend Yield card | Exact but dependent on source quality |
| Industry P/E card | 100% Exact mathematical derivation from company CSV |
| High / Low (52W) card | 100% Exact mathematical derivation from price CSV |
| No. of Shares card | 100% Exact mathematical derivation for current data; fallback risk if source missing |
| No. of Shareholders card | Exact but dependent on source quality |
| Annual Ratios rows and cells | Exact but dependent on source quality |
| Quarterly Results rows and cells | Exact but dependent on source quality |
| Pros/Cons statements | Exact but dependent on source quality |
| Price chart close datapoints | 100% Exact |
| Price chart High/Low summary | 100% Exact |
| Price chart Returns | 100% Exact |
| Price chart axis ticks | Heuristic |
| Price tooltip date | Exact but dependent on source quality |
| Price tooltip time | Mock/Placeholder-like hardcoded display value |
| Sales chart Sales bars | Exact but dependent on source quality |
| Sales chart Net Profit bars | Exact but dependent on source quality |
| Sales chart Net Margin | 100% Exact mathematical derivation |
| Sales chart Sales growth | 100% Exact mathematical derivation |
| EV/EBITDA | Cannot Verify |
| Price to Book | Exact but dependent on source quality |
| Market Cap / Sales | Exact but dependent on source quality |
| Valuation chart basis labels | Approximation, because period bases are forward-filled |
| Valuation chart change | 100% Exact mathematical derivation from derived series |
| Financial Performance revenue | Exact but dependent on source quality |
| Financial Performance net income | Exact but dependent on source quality |
| Financial Performance net margin | 100% Exact mathematical derivation |
| Debt chart Debt | Exact but dependent on source quality |
| Debt chart Free Cash Flow | Exact but dependent on source quality |
| Debt chart Cash & equivalents | Cannot Verify |
| Shareholding percentages | Exact but dependent on source quality |
| Shareholding donut geometry | 100% Exact mathematical derivation from displayed percentages |
| Related stock names/codes/CMP | Exact but dependent on source quality |
| Related stock percentage | Exact source display, but semantically risky because it is profit variation, not price return |
| Document titles/URLs | Exact but dependent on source quality |
| Document hosts | 100% Exact URL derivation |
| Ticker tape labels/prices | Exact but dependent on source quality |
| Ticker tape percentage | Exact source display, but semantically risky because it is profit variation, not price return |
| Footer year range/app links/provider copy | Mock/Placeholder for this audit scope, because not sourced from reference corpus |

## Automated Regression Test Suite

### Test Architecture

Add a compliance layer with three parts:

1. **Field manifest**: a machine-readable source map for every data-bearing UI field.
2. **Pure formula library**: independent formula implementations for approved derivations.
3. **Rendered-page audit**: Playwright or Testing Library checks that every visible data-bearing element has a `data-audit-id` matching the manifest.

Recommended files:

- `src/lib/audit/company-page-manifest.ts`
- `src/lib/audit/company-page-formulas.ts`
- `tests/company-page-source-audit.test.ts`
- `tests/company-page-render-audit.spec.ts`

Do not rely on component implementation functions for formula verification. Recompute from raw source files.

### Test Strategy

- Enumerate all visible fields through `data-audit-id`.
- Fail if a visible data field lacks a manifest entry.
- Fail if a manifest entry points outside the approved reference corpus.
- Fail if hardcoded numeric financial values appear in stock-page components outside an allowlist for chart dimensions, layout, and constants.
- Recompute formulas independently and compare rendered text or serialized audit data.
- Keep chart tests data-level, not pixel-level: validate SVG paths/aria tables against expected series counts and values.
- Treat missing cash/face-value fallbacks as explicit failures unless the UI visibly discloses fallback status.

### Required Test Cases

| Test Case | Expected Result |
| --- | --- |
| All `data-audit-id` values exist in manifest | Pass only when every data-bearing element is mapped. |
| Manifest has no orphan entries | Fail when a mapped metric no longer renders. |
| Header price comes from `key_metrics["Current Price"]` | Recomputed text equals rendered text. |
| Header fallback never uses `overview.current_price` when it conflicts | Fail if fallback path is used without disclosure. |
| Industry P/E recomputation | Rendered 14.81 equals independent formula. |
| 52W high/low recomputation | Rendered high/low equals max/min over 365-day price window. |
| Share count recomputation | Rendered shares equals latest equity capital / face value. |
| Price chart series count | Rendered/audit close series has 497 ALL points. |
| Price chart returns | Rendered return equals close-endpoint formula. |
| Sales margin | Every margin equals net profit / sales. |
| Valuation ratios | Every ratio equals approved formula; fail EV/EBITDA when cash source missing. |
| Debt chart series | Fail if a legend label has no source row and no disclosure. |
| Related stock percent label | Fail unless UI labels it as `Qtr Profit Var%` or equivalent. |
| Mock/placeholder scan | Fail on `mock`, `dummy`, `sample`, `placeholder`, `TBD`, `N/A`, and hardcoded financial literals outside allowlist. |
| Cross-source drift | Warn or fail when same metric exists in multiple reference files and differs beyond tolerance. |

### Example Manifest

```ts
export const companyPageFieldManifest = {
  "header.companyName": {
    kind: "direct",
    source: ["stock_page/{code}.json", "overview.company_name"]
  },
  "header.currentPrice": {
    kind: "direct",
    source: ["stock_page/{code}.json", "key_metrics.Current Price"],
    transform: "parseCurrency -> formatINR2"
  },
  "metric.industryPe": {
    kind: "derived",
    formula: "industryPe",
    inputs: [
      "category_wise/companies.csv:Mar CapRs.Cr.",
      "category_wise/companies.csv:P/E",
      "category_wise/industry_codes.csv"
    ]
  },
  "valuation.evEbitda": {
    kind: "derived",
    formula: "evEbitda",
    requiredInputs: [
      "price.Close",
      "balance_sheet.Equity Capital",
      "key_metrics.Face Value",
      "balance_sheet.Borrowings",
      "balance_sheet.Cash Equivalents",
      "quarterly.Operating Profit"
    ],
    failIfMissing: true
  }
} as const;
```

### Example Formula Test

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseCsvRows, rowsToObjects } from "../src/lib/data/csv";

function parseNum(value: string) {
  const parsed = Number(value.replace(/[Rs.,%\\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

it("derives 52-week high/low only from price CSV", () => {
  const rows = rowsToObjects(parseCsvRows(readFileSync("stock_page/reliance_chart_data.csv", "utf8")));
  const points = rows.map((row) => ({
    date: row.Date,
    high: Number(row.High),
    low: Number(row.Low)
  }));
  const latest = Date.parse(`${points.at(-1)!.date}T00:00:00Z`);
  const start = latest - 365 * 24 * 60 * 60 * 1000;
  const window = points.filter((point) => Date.parse(`${point.date}T00:00:00Z`) >= start);

  expect(Math.max(...window.map((point) => point.high))).toBe(1611.8);
  expect(Math.min(...window.map((point) => point.low))).toBe(1290);
});
```

### Example Render Test

```ts
import { test, expect } from "@playwright/test";
import { companyPageFieldManifest } from "../src/lib/audit/company-page-manifest";

test("every visible stock data field is mapped", async ({ page }) => {
  await page.goto("/company/RELIANCE/");
  const ids = await page.locator("[data-audit-id]").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-audit-id"))
  );

  for (const id of ids) {
    expect(id, "rendered data field must have manifest entry").toBeTruthy();
    expect(companyPageFieldManifest).toHaveProperty(id!);
  }

  for (const id of Object.keys(companyPageFieldManifest)) {
    await expect(page.locator(`[data-audit-id="${id}"]`).first()).toBeVisible();
  }
});
```

### CI/CD Integration

Recommended GitHub Actions job:

```yaml
name: Stock page source audit

on:
  pull_request:
  push:
    branches: [main]

jobs:
  source-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test:source-audit
      - run: npm run test:render-audit
```

Add scripts after installing the chosen test tools:

```json
{
  "scripts": {
    "test:source-audit": "vitest run tests/company-page-source-audit.test.ts",
    "test:render-audit": "playwright test tests/company-page-render-audit.spec.ts"
  }
}
```

## Coverage Summary

Count method: one audit entry is one distinct data-bearing UI slot or formula category. Repeated cells/series are counted separately below.

- Total manifest categories audited: 83
- Direct categories: 53
- Derived categories: 30
- Exact categories: 57
- Approximate or heuristic categories: 11
- Unverifiable categories: 3
- Failed/problematic categories: 14

Repeated data coverage:

- Price chart: 497 CSV price rows traced.
- Annual ratios snapshot: 6 metrics x 7 periods = 42 direct cells traced.
- Quarterly snapshot mode: 12 metrics x 8 periods = 96 direct cells traced.
- Shareholding chart: 5 holder categories x 12 periods available; latest period displayed by default.
- Related stocks: 10 peer rows traced to the leaf category.
- Documents: 26 available document links traced; 12 annual reports shown by default before expansion.
- Ticker tape: 16 selected company rows traced, duplicated into 32 marquee slots.

## Reproducibility

Every exact or source-dependent value above can be independently reproduced from the reference corpus using the formulas in this report, except the failed/problematic elements listed in Table 3.

