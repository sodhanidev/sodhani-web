# Dense Company Data Page Design Spec

## Scope

This spec covers the compact data-first pattern used for company subpages like:

- `/company/[code]/financials/`
- `/company/[code]/shareholding/`

Core principle: **more data in less space is the moat**. These pages should feel like a professional finance workbook, not a marketing page.

## Visual Direction

- Minimal, flat, data-dense.
- Avoid cards unless content genuinely needs a contained repeated unit.
- No large hero sections.
- No heavy rounded panels.
- No section boxing with different background colors.
- Background and table surface should feel continuous.
- Use thin separators, compact spacing, and small type to create structure.

## Page Structure

### Header

Use a compact header, not a hero.

- Back link at top.
- Ticker eyebrow below back link.
- Page title: `Financials` or `Shareholding`.
- Company name as secondary text below title.
- Unit note aligned right on desktop and left on mobile.

Desktop layout:

- Header is `display: flex`.
- Title block left.
- Unit note right.
- Align to bottom.

Mobile layout:

- Header becomes one-column grid.
- Unit note aligns left.

Recommended sizing:

- Page title: `clamp(26px, 3vw, 40px)` desktop, max `34px` mobile.
- Company name: `13px`, medium muted.
- Eyebrow: `12px`, uppercase, subtle letter spacing.
- Unit note: `11px`, muted.

## Snapshot Metrics Strip

Use a flat metric strip immediately below the header.

Desktop:

- 8 columns.
- `gap: 10px 24px`.
- Top and bottom borders only.
- No individual card borders.
- No alternate background.
- Padding: `10px 0`.

Mobile:

- 2 columns.
- `gap: 10px 18px`.

Metric typography:

- Label: `11px`, muted, weight `500`.
- Value: `15px`, weight `500`, tabular numerals.
- Period/meta: `10px`, muted, weight `500`.

Financials snapshot fields:

- Sales
- Net Profit
- OPM
- Assets
- Borrowings
- Free Cash Flow
- Net Cash Flow
- ROCE

Shareholding snapshot fields:

- Promoters
- FIIs
- DIIs
- Public
- Government
- Named Holders
- Latest Quarter
- Latest Year

## Sticky Section Navigation

Use compact pills for section jumps.

- Sticky under the snapshot strip.
- Desktop `top`: app nav offset minus 1px.
- Mobile `top: 0`.
- Background: page background with slight transparency and blur.
- Bottom border only.
- Horizontal scrolling on small screens.
- No visible scrollbar.

Pill styling:

- Height: `27px`.
- Border: thin line.
- Radius: `999px`.
- Padding: `0 10px`.
- Label: `12px`, weight `500`.
- Count/meta: `10px`, muted.

Financials pills:

- Income
- Balance Sheet
- Cash Flow
- Ratios

Shareholding pills:

- Quarterly Pattern
- Yearly Pattern
- Quarterly Investors
- Yearly Investors

## Section Headers

Keep section headers tight.

- Kicker: `11px`, muted, weight `500`.
- Heading: `18px`, weight `600`, line-height `1.18`.
- Meta text: `11px`, muted, weight `500`.
- Section gap: `9px`.
- Distance between sections: `24px`.

Avoid oversized section titles.

## Data Tables

Tables are the main product surface.

Table rules:

- No outer card border.
- No rounded table container.
- Top separator only.
- Sticky first column.
- Sticky table header.
- Horizontal scroll inside table wrapper only.
- No page-level horizontal scroll.
- No zebra striping.
- Use subtle hover row background.

Typography:

- Table font: `12px`.
- Header font: `10px`, muted, weight `500`, no uppercase transform.
- Row label/value weight: `500`.
- Child rows: muted, weight around `450`.
- Numeric values use tabular numerals.

Spacing:

- Cell padding: `7px 10px` desktop.
- Mobile cell padding: `7px 9px`.
- Standard numeric column min width: `88px` desktop, `82px` mobile.
- Sticky first column: `224px` desktop, `190px` mobile.
- Investor holder first column: `300px` desktop, `250px` mobile.

Table color behavior:

- Main rows use transparent background.
- Highlight rows use very light accent wash.
- Hover row uses very light accent wash.
- Sticky first column background must match page background.

## Color Tokens

Use existing app tokens. Do not create one-off colors unless the token set is expanded.

Primary:

- Background: `var(--bg)`
- Text: `var(--ink)`
- Muted text: `var(--muted)`
- Lines: `var(--line)`
- Strong lines: `var(--line-strong)`
- Positive: `var(--up)`
- Negative: `var(--down)`

Light theme examples:

- `--bg: #ffffff`
- `--ink: #151923`
- `--muted: #667085`
- `--line: #e6e9ef`

Dark theme examples:

- `--bg: #050505`
- `--ink: #f2f5f7`
- `--muted: #a8b0ba`
- `--line: #2b323d`

Important dark-mode rule:

- Table/card surfaces should not be visibly different from the page background unless the element truly needs containment.
- Prefer `background: transparent` or `background: var(--bg)` for sticky table cells.

## Positive / Negative Values

Use color only where the number is directional:

- Growth %
- Margin %
- Profit
- Cash flow
- ROCE / ROE

Positive:

- `var(--up)`

Negative:

- `var(--down)`

Do not color neutral ownership percentages by default.

## Responsiveness

Mobile target:

- No page-level horizontal scroll.
- Snapshot strip becomes 2 columns.
- Tables scroll horizontally inside their own wrapper.
- Sticky nav scrolls horizontally.
- Header and section metadata stack cleanly.

Desktop target:

- Use almost full available width.
- Show 8 snapshot metrics in one row.
- Keep table rows tight.
- Avoid wasted vertical space above the first table.

## Implementation Notes

Current web implementation uses:

- `src/components/company/FinancialsDetailsClient.tsx`
- `src/components/company/ShareholdingDetailsView.tsx`
- `src/components/company/company.module.css`
- `src/components/layout.module.css` for ticker overflow containment

Known pattern classes:

- `financials-detail-page`
- `financials-summary-grid`
- `financials-control-row`
- `financials-jump-nav`
- `financials-table`
- `ownership-detail-page`
- `ownership-summary-grid`
- `ownership-control-row`
- `ownership-jump-nav`
- `ownership-table`

Quality bar:

- `npm run lint` must pass.
- `npm run build` must pass.
- Browser check should confirm no horizontal page overflow.
