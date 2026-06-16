# Research Reports — Mobile Build Prompt

Build the "Brokerage & Research Reports" section for mobile. Copy the spec below.

## What it is
A list of recent brokerage reports/recommendations on listed Indian companies, on the home screen below the market cards.

## Current data is placeholder
Web ships this with a **static hand-maintained array** — no live feed, no real PDF links. The PDF icon is **decorative, not clickable**. Build the UI from this spec; real data is a backend TODO.

## Fields per row

| Field | Type | Example | Notes |
|---|---|---|---|
| `company` | string | "Titan Company" | display name |
| `code` | string | "TITAN" | stock symbol; taps to company page |
| `action` | enum | "Buy" | `Buy` `Sell` `Hold` `Accumulate` `Initiating Coverage`. Green for all, red for `Sell` |
| `target` | number (₹) | 4900 | target price, Indian format (`4,900.00`) |
| `broker` | string | "JM Financial" | issuing brokerage |
| `date` | string | "15 Jun 2026" | publish date |
| `id` | string | "r1" | row key |

No report-URL field exists today.

## Layout
Desktop columns: Company · Action (colored pill) · Target (₹, right-aligned) · Broker · Date · Report (PDF icon).

Mobile: one card per report — company + action pill on top row; target/broker/date as a meta line; PDF icon trailing.

## Interactions
- Tap company → company detail screen (web route `/company/{code}/`).
- "View all" header → market screen.

## How web gets the data
It doesn't fetch — static TS array `RESEARCH_REPORTS` in `src/lib/data/home-tables.ts`, bundled at build. Whole site is static, no request-time fetching.

## Where real data comes from (when live)
Brokerage report aggregators:
- BSE research reports — `bseindia.com/markets/equity/eqreports/`
- Business Standard research-report listings
- Paid feeds (Trendlyne, broker APIs)

Live records should add `reportUrl` (PDF link), and ideally `rating` / `upside %`. Until a backend endpoint exists, hardcode the sample array matching the fields above.

## Sample data (mirror web)
```
TITAN     Titan Company        Buy                  4900  JM Financial         15 Jun 2026
RELIANCE  Reliance Industries  Buy                  1650  Motilal Oswal        15 Jun 2026
SUNPHARMA Sun Pharma.Inds.     Accumulate           1920  ICICI Securities     12 Jun 2026
LUPIN     Lupin                Initiating Coverage  2600  Motilal Oswal        09 Jun 2026
ZYDUSLIFE Zydus Lifesci.       Buy                  1080  JM Financial         09 Jun 2026
DRREDDY   Dr Reddy's Labs      Hold                 1350  Kotak Inst. Equities 05 Jun 2026
DIVISLAB  Divi's Lab.          Buy                  7400  Nuvama               05 Jun 2026
```
