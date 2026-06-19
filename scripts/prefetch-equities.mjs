// Build-time prefetch: warm the stock_page/ cache from the equity API.
//
// The company page is built statically and getStock() reads synchronously from
// stock_page/*.json. This script fetches each ticker from the API, repairs the
// two known upstream defects (current_price / "Raw PDF" row), and writes the
// JSON to disk so the existing sync loader can serve it.
//
// Usage:
//   node scripts/prefetch-equities.mjs                 # all tickers in companies.csv
//   node scripts/prefetch-equities.mjs SUNPHARMA TCS   # explicit list
//   node scripts/prefetch-equities.mjs --limit 50      # first 50 from the csv
//   node scripts/prefetch-equities.mjs SUNPHARMA --force --out /tmp/s.json
//
// RELIANCE is always skipped: its committed file is the source of truth and is
// never fetched. Tickers with an existing file are skipped unless --force.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const EQUITY_API_BASE =
  "https://server-production-8226.up.railway.app/api/equity";

// Build the query-param URL the API now expects:
//   /api/equity?code=SUNPHARMA[&consolidated=true]
// The `code` must be uppercase — lowercase codes 404.
function equityUrl(code, consolidated) {
  const params = new URLSearchParams({ code: code.toUpperCase() });
  if (consolidated) {
    params.set("consolidated", "true");
  }
  return `${EQUITY_API_BASE}?${params.toString()}`;
}
const ROOT = process.cwd();
const STOCK_DIR = path.join(ROOT, "stock_page");
const COMPANY_FILE = path.join(ROOT, "category_wise", "companies.csv");

// Never fetch these — committed on-disk files own them.
const PROTECTED = new Set(["RELIANCE"]);

// --- CSV parsing (mirrors src/lib/data/csv.ts) -----------------------------

function parseCsvRows(raw) {
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char === "\r") {
      if (next !== "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      }
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((candidate) =>
    candidate.some((value) => value.trim().length > 0)
  );
}

function readTickersFromCsv() {
  const rows = parseCsvRows(fs.readFileSync(COMPANY_FILE, "utf8"));
  const [header, ...body] = rows;
  const codeIndex = header.indexOf("Company Code");
  if (codeIndex === -1) {
    throw new Error('companies.csv missing "Company Code" column');
  }
  const seen = new Set();
  const codes = [];
  for (const row of body) {
    const code = (row[codeIndex] ?? "").trim().toUpperCase();
    if (code && !seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }
  return codes;
}

// --- Fetch + sanitize (mirrors src/lib/data/equity-api.ts) -----------------

async function fetchEquityRaw(code) {
  const res = await fetch(equityUrl(code, false));
  if (!res.ok) {
    return undefined;
  }
  return res.json();
}

// Consolidated variant. API only has it for some tickers -> undefined on 404.
async function fetchEquityConsolidatedRaw(code) {
  const res = await fetch(equityUrl(code, true));
  if (!res.ok) {
    return undefined;
  }
  return res.json();
}

function sanitizeEquityRaw(raw) {
  const correctPrice = raw.key_metrics?.["Current Price"];
  const overview = {
    ...(raw.overview ?? {}),
    current_price: correctPrice ?? raw.overview?.current_price ?? ""
  };
  const quarterly = Array.isArray(raw.quarterly)
    ? raw.quarterly.filter((row) => String(row[""] ?? "").trim() !== "Raw PDF")
    : raw.quarterly;
  return { ...raw, overview, quarterly };
}

// --- argv ------------------------------------------------------------------

function parseArgs(argv) {
  const tickers = [];
  let force = false;
  let limit = null;
  let out = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force") {
      force = true;
    } else if (arg === "--limit") {
      limit = Number.parseInt(argv[(i += 1)], 10);
    } else if (arg === "--out") {
      out = argv[(i += 1)];
    } else if (!arg.startsWith("--")) {
      tickers.push(arg.toUpperCase());
    }
  }

  return { tickers, force, limit, out };
}

// --- main ------------------------------------------------------------------

async function main() {
  const { tickers, force, limit, out } = parseArgs(process.argv.slice(2));

  let codes = tickers.length > 0 ? tickers : readTickersFromCsv();
  if (limit != null && Number.isFinite(limit)) {
    codes = codes.slice(0, limit);
  }

  fs.mkdirSync(STOCK_DIR, { recursive: true });

  let fetched = 0;
  let consolidated = 0;
  let skipped = 0;
  let notFound = 0;
  let failed = 0;

  for (const code of codes) {
    if (PROTECTED.has(code)) {
      console.log(`skip   ${code} (protected, committed file)`);
      skipped += 1;
      continue;
    }

    const target =
      out ?? path.join(STOCK_DIR, `${code.toLowerCase()}.json`);

    if (!out && !force && fs.existsSync(target)) {
      console.log(`skip   ${code} (exists, use --force to refetch)`);
      skipped += 1;
      continue;
    }

    try {
      const raw = await fetchEquityRaw(code);
      if (!raw) {
        console.log(`404    ${code}`);
        notFound += 1;
        continue;
      }
      const clean = sanitizeEquityRaw(raw);
      fs.writeFileSync(target, JSON.stringify(clean, null, 2));
      console.log(`ok     ${code} -> ${path.relative(ROOT, target)}`);
      fetched += 1;

      // Consolidated variant: best-effort, only some tickers have it.
      const consTarget = out
        ? out.replace(/\.json$/u, ".consolidated.json")
        : path.join(STOCK_DIR, `${code.toLowerCase()}.consolidated.json`);
      const consRaw = await fetchEquityConsolidatedRaw(code);
      if (consRaw) {
        fs.writeFileSync(consTarget, JSON.stringify(sanitizeEquityRaw(consRaw), null, 2));
        console.log(`  +C   ${code} -> ${path.relative(ROOT, consTarget)}`);
        consolidated += 1;
      } else {
        console.log(`  -C   ${code} (no consolidated)`);
      }
    } catch (error) {
      console.log(`error  ${code}: ${error.message}`);
      failed += 1;
    }
  }

  console.log(
    `\ndone: ${fetched} fetched (${consolidated} +consolidated), ${skipped} skipped, ${notFound} not found, ${failed} failed (of ${codes.length})`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
