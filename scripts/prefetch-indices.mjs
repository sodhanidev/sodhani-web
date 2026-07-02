// Build-time prefetch: scrape NSE index levels + constituents to disk.
//
// The site ships fully static (AGENTS.md §4), so /indices reads a committed
// JSON snapshot rather than fetching at request time. This drives a real
// browser because nseindia.com sits behind Akamai and rejects plain fetch —
// but an in-page fetch from a warmed nseindia.com tab carries the bot cookies
// and returns clean JSON. Firefox is used because headless Chromium fails
// NSE's HTTP/2 negotiation (ERR_HTTP2_PROTOCOL_ERROR); Firefox negotiates fine.
//
// Why NSE, not BSE: BSE's only public bulk endpoint returns gainers *only* —
// decliners are absent, so a BSE heatmap can't be coloured correctly. NSE's
// getIndicesData returns every constituent with a signed pChange plus an
// advance/decline count, in one call per index. That's exactly a heatmap.
//
// One endpoint per index:
//   .../marketWatchApi?functionName=getIndicesData&symbol=<INDEX NAME>
//     -> data.aduCount        = { advances, declines, unchange }  (breadth)
//        data.data[0]         = the index itself (priority:1): level, change…
//        data.data[1..]       = constituents: symbol, lastPrice, change,
//                               pChange (signed), ffmc (free-float mcap = the
//                               heatmap weight), 52wk hi/lo, volume.
//
// Usage:
//   node scripts/prefetch-bse-indices.mjs           # -> category_wise/bse_indices.json
//   node scripts/prefetch-bse-indices.mjs --out /tmp/x.json
//
// Snapshot is indicative (last traded), not a live feed. Re-run to refresh.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { firefox } from "playwright";

const ROOT = process.cwd();
const OUT_DEFAULT = path.join(ROOT, "category_wise", "nse_indices.json");
const COMPANY_FILE = path.join(ROOT, "category_wise", "companies.csv");
const WARM_URL = "https://www.nseindia.com/market-data/live-equity-market";
const GET_INDICES =
  "https://www.nseindia.com/api/NextApi/apiClient/marketWatchApi?functionName=getIndicesData&symbol=";
// Intraday index chart: grapthData = [[epochMs, value], ...] over the session.
const GET_CHART = "https://www.nseindia.com/api/chart-databyindex?indices=true&index=";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0";

const ALL_INDICES = "https://www.nseindia.com/api/allIndices";

// Names we skip: bond/G-Sec (no equity constituents), VIX (volatility, no
// holdings), and synthetic leverage/inverse/USD/dividend-point series. These
// return no usable constituent rows from getIndicesData anyway; skipping them
// up front saves ~20 failed round-trips.
const SKIP_RE =
  /\bG-SEC\b|BHARAT BOND|INDIA VIX|LEVERAGE|INVERSE|\bUSD\b|DIVIDEND POINTS/u;

// Broad = size/market-cap baskets; sector = single-industry; everything else
// (thematic, strategy, factor tilts) is "other". Heuristic off the name — the
// field is metadata only, nothing renders on it.
const SECTOR_RE =
  /\b(BANK|FINANCIAL|AUTO|FMCG|\bIT\b|MEDIA|METAL|PHARMA|REALTY|HEALTHCARE|CONSUMER DURABLES|OIL & GAS|CHEMICALS|CEMENT|PSU|PRIVATE BANK|CAPITAL MARKETS)\b/u;
const BROAD_RE =
  /\b(NIFTY 50|NIFTY 100|NIFTY 200|NIFTY 500|NEXT 50|MIDCAP|SMALLCAP|MICROCAP|LARGEMIDCAP|MIDSMALLCAP|TOTAL MARKET|MULTICAP)\b/u;

function classify(name) {
  if (SECTOR_RE.test(name)) return "sector";
  if (BROAD_RE.test(name)) return "broad";
  return "other";
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/gu, " and ")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

// Fetch every NSE index name, drop the non-equity/synthetic ones, and build the
// scrape list. Falls back to a minimal broad set if the list call fails.
async function buildIndexList(apiJson) {
  const res = await apiJson(ALL_INDICES);
  const names = Array.isArray(res.data?.data)
    ? res.data.data.map((d) => d.index).filter((n) => typeof n === "string")
    : [];
  const usable = names.filter((n) => !SKIP_RE.test(n));
  const list = usable.length ? usable : ["NIFTY 50", "NIFTY BANK", "NIFTY IT"];
  return list.map((symbol) => ({
    slug: slugify(symbol),
    label: symbol.replace(/\bNIFTY\b/u, "Nifty"),
    symbol,
    kind: classify(symbol)
  }));
}

// --- args ------------------------------------------------------------------

function parseArgs(argv) {
  let out = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") out = argv[(i += 1)];
  }
  return { out };
}

// --- company-code set (only link constituents that have a company page) ----
// NSE symbols match our Company Code (e.g. RELIANCE, TCS), so the intersection
// is a plain lookup.

function readKnownCompanyCodes() {
  try {
    const raw = fs.readFileSync(COMPANY_FILE, "utf8");
    const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    const [header, ...lines] = text.split(/\r?\n/u);
    const idx = header.split(",").indexOf("Company Code");
    if (idx === -1) return new Set();
    const codes = new Set();
    for (const line of lines) {
      const code = (line.split(",")[idx] ?? "").trim().toUpperCase();
      if (code) codes.add(code);
    }
    return codes;
  } catch {
    return new Set();
  }
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Two-point prevClose->LTP fallback when the intraday chart is unavailable.
function synthSpark(prevClose, ltp) {
  return [prevClose, ltp].filter((v) => typeof v === "number" && Number.isFinite(v));
}

// Evenly downsample a series to at most `max` points, always keeping the last.
function downsample(values, max = 40) {
  if (values.length <= max) return values;
  const step = (values.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => values[Math.round(i * step)]);
}

// Real intraday sparkline from NSE's chart endpoint. grapthData is [[ts, val]…];
// we keep the values, downsampled. Returns [] on any failure so the caller can
// fall back to the two-point synth.
async function fetchSpark(apiJson, symbol) {
  const res = await apiJson(GET_CHART + encodeURIComponent(symbol));
  const raw = res.data?.grapthData;
  if (!Array.isArray(raw)) return [];
  const values = raw
    .map((p) => (Array.isArray(p) ? p[1] : null))
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  return values.length >= 2 ? downsample(values) : [];
}

// --- main ------------------------------------------------------------------

async function main() {
  const { out } = parseArgs(process.argv.slice(2));
  const target = out ?? OUT_DEFAULT;
  const knownCodes = readKnownCompanyCodes();

  const browser = await firefox.launch();
  const ctx = await browser.newContext({ userAgent: UA });
  const page = await ctx.newPage();

  // Warm the Akamai cookie by loading the live-market page first.
  await page.goto(WARM_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(4500);

  const apiJson = (url) =>
    page.evaluate(async (u) => {
      try {
        const res = await fetch(u, { headers: { Accept: "application/json" } });
        return { ok: res.ok, data: JSON.parse(await res.text()) };
      } catch {
        return { ok: false, data: null };
      }
    }, url);

  const fetchedAt = new Date().toISOString();
  const indices = [];

  const indexList = await buildIndexList(apiJson);
  console.log(`scraping ${indexList.length} indices...\n`);

  for (const meta of indexList) {
    // NSE occasionally returns an empty body under rapid calls; retry a couple
    // of times with a short backoff before giving up on an index.
    // Some NSE indices (Financial Services, Smallcap 100/250, Total Market, most
    // strategy tilts) return 200 with an empty {"data":{}} from this endpoint —
    // they're simply not exposed here, so retries won't help them. Retry only
    // covers genuine transient empties on the ~41 that ARE served.
    let block, rows;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = await apiJson(GET_INDICES + encodeURIComponent(meta.symbol));
      block = res.data?.data;
      rows = block?.data;
      if (Array.isArray(rows) && rows.length >= 2) break;
      await page.waitForTimeout(1200 * (attempt + 1));
    }
    if (!Array.isArray(rows) || rows.length < 2) {
      console.log(`  ${meta.slug.padEnd(18)} FAILED (empty after retries)`);
      continue;
    }

    const indexRow = rows.find((r) => r.priority === 1) ?? rows[0];
    const members = rows
      .filter((r) => r.priority !== 1 && r.symbol)
      .map((r) => {
        const code = String(r.symbol).trim().toUpperCase();
        return {
          code,
          name: r.companyName ?? r.symbol,
          ltp: num(r.lastPrice),
          changePct: num(r.pChange),
          changeVal: num(r.change),
          // Free-float market cap: the correct weight for sizing heatmap tiles.
          ffmc: num(r.ffmc),
          yearHigh: num(r.yearHigh),
          yearLow: num(r.yearLow),
          hasPage: knownCodes.has(code)
        };
      })
      .filter((m) => m.ltp !== null)
      .sort((a, b) => (b.ffmc ?? 0) - (a.ffmc ?? 0));

    const adu = block.aduCount ?? {};
    const value = num(indexRow.lastPrice);

    const prevClose = num(indexRow.previousClose) ?? value;
    let spark = await fetchSpark(apiJson, meta.symbol);
    if (spark.length < 2 && value !== null) spark = synthSpark(prevClose, value);

    indices.push({
      slug: meta.slug,
      label: meta.label,
      kind: meta.kind,
      value,
      changePct: num(indexRow.pChange),
      changeVal: num(indexRow.change),
      open: num(indexRow.open),
      dayHigh: num(indexRow.dayHigh),
      dayLow: num(indexRow.dayLow),
      yearHigh: num(indexRow.yearHigh),
      yearLow: num(indexRow.yearLow),
      spark,
      breadth: {
        advances: num(adu.advances) ?? members.filter((m) => (m.changePct ?? 0) > 0).length,
        declines: num(adu.declines) ?? members.filter((m) => (m.changePct ?? 0) < 0).length,
        unchanged: num(adu.unchange) ?? 0
      },
      constituentCount: members.length,
      constituents: members
    });

    console.log(
      `  ${meta.slug.padEnd(18)} lvl=${value ?? "-"} -> ${members.length} members (${adu.advances ?? "?"}↑ ${adu.declines ?? "?"}↓)`
    );

    // Be polite between index calls.
    await page.waitForTimeout(600);
  }

  if (!indices.length) {
    throw new Error("no indices scraped — NSE likely blocked the session");
  }

  const payload = { fetchedAt, source: "nseindia.com", indices };
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(payload, null, 2));
  console.log(`\nwrote ${indices.length} indices -> ${path.relative(ROOT, target)}`);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
