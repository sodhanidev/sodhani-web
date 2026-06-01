# Sodhani Dark Mode Design System

Version: 2026-06-01  
Source of truth inspected: `src/app/globals.css`, `src/components/layout.module.css`, `src/app/page.module.css`, `src/components/LandingSearch.module.css`, `src/components/company/company.module.css`, `src/components/market.module.css`, `src/components/AuthPlaceholder.module.css`, `src/components/SiteFooter.module.css`, `src/app/layout.tsx`

## 1. Design Intent

Sodhani dark mode is a near-black, finance-first interface. It should feel like a clean market terminal rather than a colorful consumer app.

The visual direction is:

- Canvas-first: the app sits on a deep black base, not on stacked colored cards.
- Minimal contrast: use subtle dark surfaces and hairline borders, not heavy boxes.
- Data clarity: numbers use tabular figures, status colors are precise, and charts get the strongest color treatment.
- Cool neutral base: text and borders lean blue-gray; accents are pale blue, green, red, and restrained amber.
- Flat company pages: company overview surfaces should blend into the page background unless a table, modal, input, or repeated item needs framing.

## 2. Theme Behavior

The web app stores the theme in local storage as `sodhani-theme`.

Allowed preferences:

- `light`
- `dark`
- `system`

Runtime behavior:

- The resolved theme is written to `html[data-theme]`.
- The selected preference is written to `html[data-theme-preference]`.
- Dark mode must set native/system color scheme to dark.
- If no preference exists, the web app defaults to `light`.
- If preference is `system`, the app listens to OS color-scheme changes and updates live.

Mobile implementation requirement:

- Store the user preference with the same values: `light`, `dark`, `system`.
- Resolve `system` from the OS appearance setting.
- Apply the resolved palette before first paint to avoid a light flash.

## 3. Core Dark Tokens

These values are the canonical dark tokens from the current web app.

| Token | Value | Usage |
| --- | --- | --- |
| `bg` | `#050505` | Primary app canvas and company/chart background. |
| `bodyBg` | `#050505` | Screen background. Same as `bg`. |
| `surface` | `#101114` | Raised surfaces, auth buttons, table cards. |
| `surface2` | `#17191d` | Hover backgrounds, skeletons, secondary fills. |
| `panelBg` | `rgba(16, 17, 20, 0.92)` | Generic card/panel fill. Use sparingly. |
| `panelBgSolid` | `#101114` | Solid panel and sticky table column background. |
| `panelSubtleBg` | `#0b0c0f` | Deep subtle panel surfaces. |
| `ink` | `#f2f5f7` | Primary text. |
| `headingStrong` | `#f2f7ef` | Major headings and important labels. |
| `muted` | `#a8b0ba` | Secondary text, metadata, inactive tabs. |
| `iconMuted` | `#9aa5b2` | Search/icon neutral. |
| `line` | `#2b323d` | Default border/divider. |
| `lineStrong` | `#46505f` | Hover/focus border. |
| `focus` | `#a8c5ff` | Focus ring. |
| `shadow` | `0 18px 45px rgba(0, 0, 0, 0.28)` | Rare dark-mode elevation shadow. |
| `panelHairlineShadow` | `0 1px 0 rgba(255, 255, 255, 0.03)` | Subtle panel top edge. |

## 4. Semantic Accent Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `accent` | `#8fb4ff` | Primary interactive accent in general UI. |
| `accent2` | `#9abfff` | Secondary links and emphasized navigation. |
| `accent3` | `#dda46f` | Warm accent for document/category badges. |
| `up` | `#5fe08f` | Positive financial movement. |
| `down` | `#ff7474` | Negative financial movement. |
| `upSoft` | `rgba(53, 179, 97, 0.18)` | Positive note/pro/con background. |
| `downSoft` | `rgba(255, 101, 101, 0.17)` | Negative note/pro/con background. |
| `linkBlue` | `#a9bbff` | Text links in content areas. |

Use status colors consistently:

- Positive returns, up ticks, gain badges: `up`.
- Negative returns, down ticks, loss badges: `down`.
- Neutral/flat market movement: use muted gray, not blue.
- Never use saturated green/red as large backgrounds. Use the soft fills only for small note rows or badges.

## 5. Mobile Token Pack

Use this as the mobile design token object. Names are mobile-friendly aliases mapped to the web source.

```ts
export const sodhaniDark = {
  color: {
    background: {
      app: "#050505",
      canvas: "#050505",
      surface: "#101114",
      surfaceAlt: "#17191d",
      surfaceDeep: "#0b0c0f",
      overlayPanel: "rgba(16, 17, 20, 0.92)"
    },
    text: {
      primary: "#f2f5f7",
      heading: "#f2f7ef",
      secondary: "#a8b0ba",
      tertiary: "#9aa5b2",
      inverse: "#050505",
      white: "#ffffff"
    },
    border: {
      default: "#2b323d",
      strong: "#46505f",
      subtleOnDark: "rgba(255, 255, 255, 0.03)",
      translucent: "rgba(255, 255, 255, 0.18)"
    },
    accent: {
      primary: "#8fb4ff",
      secondary: "#9abfff",
      warm: "#dda46f",
      focus: "#a8c5ff"
    },
    status: {
      up: "#5fe08f",
      down: "#ff7474",
      upSoft: "rgba(53, 179, 97, 0.18)",
      downSoft: "rgba(255, 101, 101, 0.17)",
      tickerUp: "#45d483",
      tickerDown: "#ff5a66",
      tickerFlat: "#9ea8a1"
    },
    chart: {
      up: "#4dd382",
      down: "#ff7078",
      grid: "rgba(188, 197, 207, 0.08)",
      axis: "#bcc5cf",
      hoverLine: "#6f7a88",
      tooltipBg: "rgba(28, 28, 30, 0.92)",
      tooltipBorder: "rgba(255, 255, 255, 0.10)",
      tooltipText: "#ffffff",
      tooltipMuted: "rgba(255, 255, 255, 0.68)"
    },
    table: {
      headBg: "#1b222d",
      headText: "#d4dbe3",
      rowAlt: "rgba(27, 34, 45, 0.50)",
      rowHover: "#222b38",
      scrollTrack: "rgba(23, 29, 39, 0.92)"
    },
    controls: {
      topbarBg: "rgba(12, 15, 20, 0.86)",
      controlBg: "rgba(16, 17, 20, 0.78)",
      controlSolid: "#101114",
      controlHover: "#17191d",
      searchBg: "#17191d",
      searchPlaceholder: "#9aa5b2"
    }
  },
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 14,
    pill: 999
  },
  borderWidth: {
    hairline: 1
  },
  shadow: {
    raised: "0 18px 45px rgba(0, 0, 0, 0.28)",
    panelHairline: "0 1px 0 rgba(255, 255, 255, 0.03)"
  }
};
```

## 6. Typography

Web uses Inter through `next/font`:

```css
var(--font-inter), "Inter", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif
```

Mobile implementation:

- Prefer bundled Inter if available.
- If Inter is not bundled, use the platform sans-serif: SF Pro on iOS, Roboto on Android.
- Use tabular numerals for all prices, returns, table values, chart axis labels, and ticker values.
- Do not use Aptos.
- Avoid heavy display weights. Current UI has been moving toward lighter finance typography.

Suggested mobile type scale:

| Role | Size | Weight | Line height | Notes |
| --- | ---: | ---: | ---: | --- |
| Screen title | 26-32 | 500-600 | 1.05-1.15 | Company names, large page titles. |
| Price hero | 34-42 | 500 | 1.0 | Use tabular numerals. |
| Section title | 20-24 | 600 | 1.2 | Keep compact. |
| Body | 14-15 | 400-450 | 1.45-1.6 | App default. |
| Label | 11-12 | 500-650 | 1.2 | Uppercase only where current web does it. |
| Table cell | 13-14 | 400-500 | 1.35 | Tabular numerals for numeric cells. |
| Button | 13-14 | 500-650 | 1.0 | Avoid overbold. |

## 7. Navigation and Chrome

### Market Ticker

The top ticker is intentionally darker and greener than the rest of the app.

| Element | Value |
| --- | --- |
| Background | `#07120d` |
| Text | `#f1f5f2` |
| Price | `#c9d5cd` |
| Up | `#45d483` |
| Down | `#ff5a66` |
| Flat | `#9ea8a1` |
| Bottom border | `rgba(255, 255, 255, 0.16)` |
| Hover row | `rgba(255, 255, 255, 0.08)` |

Mobile guidance:

- Height: 32-36 px.
- One-line horizontal marquee or horizontally scrollable list.
- Pause animation while user touches or drags.
- Use tabular figures.

### Top App Bar

| Element | Value |
| --- | --- |
| Background | `rgba(12, 15, 20, 0.86)` |
| Blur | 12 px backdrop blur |
| Text | `ink` |
| Brand mark size | 38 px web; 30-34 px mobile |
| Brand text | 17 px, weight 500 |
| Divider | none by default |

Mobile guidance:

- Keep the bar translucent, not solid gray.
- Use a blur material over `#050505`.
- Search should be the main control, not a secondary popover-only button.

### Search Field

| Element | Value |
| --- | --- |
| Background | `#17191d` |
| Border | same as background normally |
| Active border | `#46505f` |
| Text | `#f2f5f7` |
| Placeholder | `#9aa5b2` |
| Icon | `#9aa5b2` |
| Popover background | `#101114` |
| Popover border | `#2b323d` |
| Result hover | `#17191d` |

Mobile guidance:

- Search input min height: 38-44 px.
- Radius: 8 px in app chrome, 14 px on landing/search hero.
- Results should sit on `surface`, not a lighter gray.

## 8. Landing Page Dark Mode

Landing dark mode has a slightly separate semantic token family but should still feel like the same product.

| Token | Value |
| --- | --- |
| Landing background | `#050505` |
| Landing text | `#edf3f4` |
| Strong text | `#f4f7f7` |
| Muted text | `#aab5bd` |
| Muted secondary | `#9aa8b3` |
| Line | `#303b45` |
| Strong line | `#556372` |
| Surface | `#101114` |
| Soft surface | `#17191d` |
| Search background | `#101114` |
| Logo text | `#eef3f4` |
| Nav hover | `#c8d2d7` |
| Placeholder | `#8896a1` |
| Market border | `#21364c` |
| Market divider | `#22394f` |
| Result border | `#28323c` |
| Heart/accent red | `#ff6b5d` |

Landing footer background:

```css
radial-gradient(circle at 15% 10%, rgba(27, 115, 91, 0.24), transparent 34%),
radial-gradient(circle at 82% 0%, rgba(36, 86, 116, 0.2), transparent 32%),
linear-gradient(135deg, #020b15 0%, #031723 48%, #031412 100%)
```

Landing CTA behavior in dark mode:

- Filled account button background: `#f4f7f7`.
- Filled account button text: `#0c0f14`.
- Hover background: `#edf3f4`.
- Avoid blue/purple CTAs on the landing page. The current web app uses a near-white CTA in dark mode.

Landing market widget:

- Large rounded container: 34 px radius web; use 22-28 px on mobile.
- Container background should remain `#050505`.
- Use borders/dividers rather than filled cards.
- Up sparkline: `#18a957`.
- Down sparkline: `#ff304b`.
- Positive change text: `#16a34a`.
- Negative change text: `#f2273f`.

## 9. Market Browser

Market browser pages use the global panel/table system.

Cards:

- Border: `#2b323d`.
- Background: `rgba(16, 17, 20, 0.92)`.
- Hover border: `#46505f`.
- Hover fill: `#101114`.
- Radius: 8 px.
- Shadow: only `0 18px 45px rgba(0, 0, 0, 0.28)` on hover or strong raised states.

Tables:

- Header background: `#1b222d`.
- Header text: `#d4dbe3`.
- Body text: `#f2f5f7`.
- Row divider: `#2b323d`.
- Alternate row: `rgba(27, 34, 45, 0.50)`.
- Hover row: `#222b38`.
- Horizontal scroll track: `rgba(23, 29, 39, 0.92)`.
- Scroll thumb: use `#8fb4ff` mixed toward muted gray or the exact app gradient where supported.

Mobile guidance:

- Prefer list rows over full-width cards for companies.
- Keep each row dense: company name, price, market cap, and change.
- Use subtle separators, not card-per-row blocks unless the row contains multiple grouped metrics.

## 10. Company Page

The company page is the strongest expression of the "no boxes" direction.

Layout:

- Background: `#050505`.
- Hero, chart, key metrics, and many panels are transparent on the company page.
- Section separation comes from spacing, not boxed backgrounds.
- Current web width target is very wide. Mobile should keep horizontal chart/table affordances inside their own scroll containers, never the whole screen.

Company section nav:

- Sticky below top app bar.
- Background: mix of topbar and panel solid. Approximate on mobile as `rgba(12, 15, 20, 0.92)` with blur 14 px.
- Bottom border: in code uses light RGBA; for mobile dark mode prefer `#2b323d` or `rgba(255, 255, 255, 0.08)`.
- Active indicator: primary text color `#f2f5f7`, 3 px underline.
- Inactive text: mix of primary and muted; approximate `#c7cdd5`.

Company hero:

- Logo tile: 52 px web, 48 px mobile.
- Logo tile border: `#2b323d`.
- Logo tile fill: `linear-gradient(135deg, #242b36 0%, #171d26 100%)`.
- Company title: `#f5f8f2`, weight 500.
- Price: `#f7fbf5`, weight 500.
- Currency/secondary price text: `#dce6dc`.
- Quote timestamp: `#99a69b`.

Company chips:

| Element | Dark value |
| --- | --- |
| Chip border | `#343d4b` |
| Chip bg | `#151922` |
| Static chip bg | `#11151c` |
| Exchange mini bg | `#1b2d3d` |
| Exchange mini text | `#9fd3ff` |
| Industry border | `#343d4b` |
| Market status bg | `#1b2d3d` |
| Market status text | `#9fd3ff` |

Key metrics:

- No card backgrounds on company page.
- Label: muted mix, uppercase, 12 px, weight 400.
- Value: primary text, 20 px, weight 400, tabular numerals.
- Grid: mobile 2 columns if space allows, 1 column on narrow screens.
- Avoid dividers between every metric.

Pros/cons:

- Positive note background: `rgba(53, 179, 97, 0.18)`.
- Negative note background: `rgba(255, 101, 101, 0.17)`.
- Radius: 8 px.
- Keep icons and text compact.

## 11. Charts

Chart dark mode is intentionally clearer than the surrounding UI. It uses stronger red/green than normal status tokens.

| Chart element | Value |
| --- | --- |
| Chart background | Transparent on company page, otherwise `#050505`/canvas. |
| Chart text | `#e6ebf0` |
| Chart strong text | `#f2f7ef` |
| Chart muted text | `#a8b0ba` |
| Grid | `rgba(188, 197, 207, 0.08)` |
| Axis labels | `#bcc5cf` |
| Hover crosshair | `#6f7a88` |
| Positive line | `#4dd382` |
| Negative line | `#ff7078` |
| Range border | `rgba(255, 255, 255, 0.18)` |
| Range bg | `#050505` |
| Range text | `#ffffff` |
| Active range bg | `#ffffff` |
| Active range text | `#050505` |

Chart tooltip:

- Background: `rgba(28, 28, 30, 0.92)`.
- Border: `rgba(255, 255, 255, 0.10)`.
- Text: `#ffffff`.
- Meta text: `rgba(255, 255, 255, 0.68)`.
- Radius: 6 px.
- Padding: 10 px vertical, 12 px horizontal.
- Blur: 14 px.
- Shadow: `0 14px 30px rgba(15, 23, 42, 0.22)`.
- Tooltip must align to the vertical crosshair and follow cursor/finger Y position where possible.

Chart grid density:

- Use very few horizontal grid lines.
- Mobile should show no more than 2-3 horizontal grid lines.
- Grid opacity must stay under 10%.

Mobile chart interaction:

- Long press or drag reveals crosshair.
- Tooltip should avoid clipping edges by flipping left/right.
- Tooltip should show price, date, and time.
- Do not show "close" labels unless explicitly requested in product copy.

## 12. Financial Performance

Current web financial performance chart:

| Element | Value |
| --- | --- |
| Card border | color-mix of `line` and `ink`; approximate `#37404d` |
| Card bg | mix of `panelBgSolid` and `surface2`; approximate `#111318` |
| Revenue bar muted | `#c6ccd6` |
| Profit bar muted | `#a4dec9` |
| Revenue bar active | `#808fa3` |
| Profit bar active | `#06b488` |
| Plot grid | `color-mix(in srgb, line 72%, transparent)` |

If mobile implements the newer preferred financial section as a table:

- Use the table tokens from section 9.
- Use tabs for statement type: Quarterly, Profit & Loss, Balance Sheet, Cash Flow, Ratios.
- Ratios belong on the main company page under Financial Performance, not hidden in a separate detail-only experience.
- Use sticky first column if the table can scroll horizontally.
- Values should be weight 400-500, not bold.

## 13. Shareholding

Dark shareholding colors:

| Holder | Value |
| --- | --- |
| Promoters | `#16c784` |
| FIIs | `#60a5fa` |
| DIIs | `#fbbf24` |
| Government | `#a78bfa` |
| Public | `#667085` |
| Other | `#98a2b3` |
| Primary bar | `#16c784` |
| Active tab bg | `rgba(22, 199, 132, 0.14)` |

Shareholding container:

- Current app still uses a subtle framed chart container here.
- Border: use `#2b323d` mixed with text, approximate `#3a424e`.
- Background: near `#101114`, but company page may make the surrounding panel transparent.
- Donut track: `line` at about 82% opacity.
- Active donut slice increases stroke width.
- Muted inactive slices drop to about 18% opacity.

Mobile guidance:

- Put donut above the legend/bars on narrow screens.
- Use period tabs as pills only for the active state; inactive tabs should be text-only.
- Keep bar tracks minimal, centered hairline style.

## 14. Documents and Badges

Document badges use semantic colors:

| Badge | Value |
| --- | --- |
| Announcements/default | `accent` = `#8fb4ff` |
| Annual reports | `accent2` = `#9abfff` |
| Credit ratings | `down` = `#ff7474` |
| Concalls | `accent3` = `#dda46f` |

Document item behavior:

- Text primary: `#f2f5f7`.
- Metadata: `#a8b0ba`.
- Hover/focus title: `accent2`, underline.
- Use compact rows on mobile; avoid large cards unless there is a thumbnail or meaningful preview content.

## 15. Auth Screens

Auth screens share the global dark background and form tokens.

| Element | Value |
| --- | --- |
| Label | `#d7e1d6` |
| Muted text | `#aab6a7` |
| Input line | `#343d4b` |
| Divider | `#2b323d` |
| Primary button bg | `#e6ebf0` |
| Primary button text | `#0e1116` |
| Placeholder | `#7f8c82` |
| Input bg | `#101114` |
| Input text | `#f2f5f7` |
| Input focus ring | primary text at 12% opacity |

Auth mobile guidance:

- Width should be full minus 40 px padding, max around 380 px.
- Inputs: 40-44 px height, 6 px radius.
- Primary button: near-white fill with near-black text.
- Do not use bright blue auth buttons in dark mode.

## 16. Ownership Detail Pages

Ownership pages define additional dark tokens.

| Token | Value |
| --- | --- |
| Ownership accent | `#f2f5f7` |
| Ownership accent strong | `#f2f5f7` |
| Ownership accent soft | `rgba(255, 255, 255, 0.06)` |
| Ownership row alt | `rgba(255, 255, 255, 0.035)` |
| Ownership card bg | `#101114` |
| Ownership muted bg | `rgba(255, 255, 255, 0.025)` |

Tables:

- Keep table cards framed on detail pages.
- First column is sticky and uses the same card background.
- Highlighted rows use `rgba(255, 255, 255, 0.06)`.
- Child rows use `rgba(255, 255, 255, 0.025)`.

## 17. Borders, Radii, and Elevation

Radii:

- Generic panels/cards: 8 px.
- Inputs/search/app controls: 6-8 px.
- Landing search: 14 px.
- Stock logo tile: 14 px.
- Chart tooltip: 6 px.
- Pills: 999 px.
- Financial/ownership detail table cards: 4 px.

Borders:

- Default border: 1 px `#2b323d`.
- Hover/strong border: 1 px `#46505f`.
- Translucent active border: `rgba(255, 255, 255, 0.18)`.
- Avoid double borders inside company overview sections.

Elevation:

- Prefer no shadow.
- Use hairline shadow for panels only: `0 1px 0 rgba(255, 255, 255, 0.03)`.
- Use raised shadow only for popovers, active overlays, and hoverable market cards:
  `0 18px 45px rgba(0, 0, 0, 0.28)`.

## 18. Interaction States

Default:

- Text and borders should be calm and low-contrast.
- Controls use transparent or near-surface backgrounds.

Hover/pressed:

- Background: `#17191d` or `#222b38` for table rows.
- Border: `#46505f`.
- Text: `#f2f5f7`.

Focus:

- Use 2 px ring with `#a8c5ff`.
- Offset should be 2-3 px where layout allows.
- For text tabs, focus may use underline plus text color if a full ring is visually too heavy.

Active:

- Range controls on charts invert: white background, black text.
- App pills and toggles may use primary text as fill and background as text if matching web behavior.
- Footer theme active option uses strong text and heavier weight, not a filled pill.

Disabled:

- Use muted text at 45-55% opacity.
- Do not use colored disabled states.

## 19. Mobile Screen Recipes

### Company Overview Mobile

Recommended vertical order:

1. App bar/search.
2. Sticky company section tabs.
3. Company logo, name, price, return.
4. Chart with range selector.
5. Key metrics.
6. Financial Performance table/charts.
7. Shareholding.
8. Documents.

Dark styling:

- Screen bg: `#050505`.
- Hero and chart surfaces: transparent.
- Company title: `#f5f8f2`.
- Price: `#f7fbf5`.
- Return: `up` or `down`.
- Range selector: border `rgba(255,255,255,0.18)`, active white on black.
- Key metric labels: muted uppercase, no dividers.

### Search Mobile

- Full-width search input, 38-44 px height.
- Background `#17191d`.
- Use rounded 8 px in topbar; 14 px on landing page.
- Result sheet: `#101114`, border `#2b323d`, shadow only if overlaying content.
- Result hover/pressed: `#17191d`.

### Financial Table Mobile

- Container clips internal horizontal scroll.
- First column sticky if supported.
- Header bg `#1b222d`.
- Alternate rows can use `rgba(27,34,45,0.50)`.
- Values weight 400-500.
- Header labels 11-12 px uppercase.

### Chart Mobile

- Chart height around 280-320 px.
- Fill available width.
- Use 2-3 grid lines maximum.
- On drag, show vertical crosshair, subtle horizontal guide, and dark tooltip.
- Tooltip follows finger Y while staying aligned to vertical crosshair.

## 20. Do and Do Not

Do:

- Use `#050505` as the true canvas.
- Use transparent sections on the company overview.
- Use `#101114` only when a surface needs to be physically grouped.
- Keep borders very subtle.
- Use tabular numerals everywhere financial data appears.
- Use green/red only for financial meaning.
- Keep chart colors stronger than ordinary UI colors.

Do not:

- Do not use cream, beige, tan, or warm gray backgrounds in dark mode.
- Do not make cards noticeably lighter than the page unless the component needs containment.
- Do not add purple/blue gradients as decoration.
- Do not make every section a card.
- Do not bold all values.
- Do not use negative letter spacing except the landing wordmark if needed.
- Do not let tables/charts create horizontal screen scroll. Scroll inside the component only.
- Do not show unexplained labels like "close" in chart tooltips.

## 21. Accessibility Targets

- Primary text on background should meet WCAG AA for normal text.
- Secondary text should still be readable on `#050505`; `#a8b0ba` is the standard muted color.
- Focus state must be visible on every interactive element.
- Red/green movement must not rely on color alone. Pair with sign, arrow, or +/- text.
- Hit targets on mobile should be at least 40 px high for primary controls.
- Chart tooltips must not obscure the exact point being inspected.

## 22. Implementation Checklist for Mobile AI Agent

1. Implement the `sodhaniDark` token pack first.
2. Wire theme preference as `light`, `dark`, or `system`.
3. Set the root screen background to `#050505` before rendering content.
4. Implement top ticker with its separate dark green-black palette.
5. Implement app bar/search with translucent topbar and `#17191d` search field.
6. Make company overview sections mostly transparent.
7. Use table tokens for market, financial, ownership, and detail tables.
8. Use chart tokens exactly; chart green/red are not the same as generic up/down.
9. Use status colors only for financial meaning.
10. Verify no screen has horizontal scroll except internal chart/table scroll.
11. Verify key metrics and financial values are not overbold.
12. Verify dark cards do not appear as random different-color blocks on the company page.

## 23. Quick Color Reference

```txt
Canvas            #050505
Surface           #101114
Surface Alt       #17191d
Panel Overlay     rgba(16, 17, 20, 0.92)
Primary Text      #f2f5f7
Heading Text      #f2f7ef
Muted Text        #a8b0ba
Icon Muted        #9aa5b2
Border            #2b323d
Border Strong     #46505f
Accent Blue       #8fb4ff
Accent Blue 2     #9abfff
Accent Warm       #dda46f
Positive          #5fe08f
Negative          #ff7474
Chart Positive    #4dd382
Chart Negative    #ff7078
Chart Grid        rgba(188, 197, 207, 0.08)
Topbar            rgba(12, 15, 20, 0.86)
Search            #17191d
Table Head        #1b222d
Table Row Hover   #222b38
Ticker Bg         #07120d
Ticker Up         #45d483
Ticker Down       #ff5a66
Tooltip Bg        rgba(28, 28, 30, 0.92)
```

