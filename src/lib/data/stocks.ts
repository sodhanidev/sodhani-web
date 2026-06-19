import fs from "node:fs";
import path from "node:path";

import { parseCsvRows, rowsToObjects } from "./csv";
import {
  fetchEquityConsolidatedRaw,
  fetchEquityRaw,
  sanitizeEquityRaw
} from "./equity-api";
import { parseNumericCell } from "./format";
import type { FinRow, FinancialTable, PricePoint, Stock } from "./types";

const STOCK_DIR = path.join(process.cwd(), "stock_page");
let availableStockCodesCache: string[] | null = null;
// Disk-read caches (committed files; misses cached too). Kept separate from the
// API caches so a disk MISS never short-circuits the live-API fallback.
const stockCache = new Map<string, Stock | undefined>();
const consolidatedStockCache = new Map<string, Stock | undefined>();
// Live-API result caches (memoized per runtime; 404 -> undefined cached).
const apiStockCache = new Map<string, Stock | undefined>();
const apiConsolidatedCache = new Map<string, Stock | undefined>();
const pricePointsCache = new Map<string, PricePoint[]>();

type RawFinRow = Record<string, string | boolean | RawFinRow[] | undefined>;

type RawStock = {
  ticker?: string;
  url?: string;
  overview?: { company_name?: string; current_price?: string; about?: string };
  key_metrics?: Record<string, string>;
  pros_cons?: { pros?: string[]; cons?: string[] };
  quarterly?: RawFinRow[];
  profit_loss?: RawFinRow[];
  balance_sheet?: RawFinRow[];
  cash_flows?: RawFinRow[];
  ratios?: RawFinRow[];
  shareholding?: { table_1?: RawFinRow[]; table_2?: RawFinRow[] };
  investors?: Stock["investors"];
  documents?: {
    announcements?: Stock["documents"]["announcements"];
    annual_reports?: Stock["documents"]["annualReports"];
    credit_ratings?: Stock["documents"]["creditRatings"];
    concalls?: Stock["documents"]["concalls"];
  };
};

function normalizeFinRows(rows: RawFinRow[]): FinancialTable {
  const [header, ...body] = rows;
  const periods = header
    ? Object.keys(header).filter((key) => key !== "" && key !== "expandable" && key !== "children")
    : [];

  function normalizeRow(row: RawFinRow): FinRow {
    const values: Record<string, string> = {};
    periods.forEach((period) => {
      values[period] = String(row[period] ?? "");
    });

    const children = Array.isArray(row.children)
      ? row.children.map((child) => normalizeRow(child as RawFinRow))
      : [];

    return {
      label: String(row[""] ?? ""),
      values,
      expandable: Boolean(row.expandable || children.length),
      children
    };
  }

  return {
    periods,
    rows: body.map(normalizeRow)
  };
}

export function getAvailableStockCodes(): string[] {
  if (availableStockCodesCache) {
    return availableStockCodesCache;
  }

  availableStockCodesCache = fs
    .readdirSync(STOCK_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/u, "").toUpperCase());
  return availableStockCodesCache;
}

// Map a raw on-disk JSON object (snake_case, screener shape) into a Stock.
// Shared by the standalone and consolidated loaders.
function buildStockFromRaw(raw: RawStock, code: string): Stock {
  return {
    ticker: String(raw.ticker ?? code).toUpperCase(),
    sourceUrl: String(raw.url ?? ""),
    overview: {
      companyName: String(raw.overview?.company_name ?? raw.ticker ?? code),
      currentPriceRaw: String(raw.overview?.current_price ?? ""),
      about: String(raw.overview?.about ?? "")
    },
    keyMetrics: raw.key_metrics ?? {},
    prosCons: {
      pros: raw.pros_cons?.pros ?? [],
      cons: raw.pros_cons?.cons ?? []
    },
    quarterly: normalizeFinRows(raw.quarterly ?? []),
    profitLoss: normalizeFinRows(raw.profit_loss ?? []),
    balanceSheet: normalizeFinRows(raw.balance_sheet ?? []),
    cashFlows: normalizeFinRows(raw.cash_flows ?? []),
    ratios: normalizeFinRows(raw.ratios ?? []),
    shareholding: {
      quarterly: normalizeFinRows(raw.shareholding?.table_1 ?? []),
      yearly: normalizeFinRows(raw.shareholding?.table_2 ?? [])
    },
    investors: raw.investors ?? { quarterly: {}, yearly: {} },
    documents: {
      announcements: raw.documents?.announcements ?? [],
      annualReports: raw.documents?.annual_reports ?? [],
      creditRatings: raw.documents?.credit_ratings ?? [],
      concalls: raw.documents?.concalls ?? []
    }
  };
}

// Read + normalize one on-disk stock JSON, with caching. Returns undefined if
// the file is absent.
function loadStockFile(
  cache: Map<string, Stock | undefined>,
  cacheKey: string,
  file: string,
  code: string
): Stock | undefined {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  if (!fs.existsSync(file)) {
    cache.set(cacheKey, undefined);
    return undefined;
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as RawStock;
  const stock = buildStockFromRaw(raw, code);
  cache.set(cacheKey, stock);
  return stock;
}

// Sync, disk-only standalone read. Returns undefined when no committed file
// exists for the ticker. Used by the candlestick pages, which pair stock data
// with the on-disk {code}_chart_data.csv (the API serves no price data).
export function getStockFromDisk(code: string): Stock | undefined {
  const lower = code.toLowerCase();
  return loadStockFile(
    stockCache,
    code.toUpperCase(),
    path.join(STOCK_DIR, `${lower}.json`),
    code
  );
}

// Disk-first, then live API. Committed files (e.g. RELIANCE) win and act as an
// API-outage fallback; everything else is fetched on demand and memoized.
// Wrapped by Next's ISR cache at the page level (revalidate). 404 -> undefined.
export async function getStock(code: string): Promise<Stock | undefined> {
  const fromDisk = getStockFromDisk(code);
  if (fromDisk) {
    return fromDisk;
  }

  const cacheKey = code.toUpperCase();
  if (apiStockCache.has(cacheKey)) {
    return apiStockCache.get(cacheKey);
  }

  const raw = await fetchEquityRaw(code);
  const stock = raw ? buildStockFromRaw(sanitizeEquityRaw(raw) as RawStock, code) : undefined;
  apiStockCache.set(cacheKey, stock);
  return stock;
}

// Consolidated variant. Disk file {code}.consolidated.json wins, else live API
// (?consolidated=true). Absent for tickers the API has no consolidated data for.
export async function getStockConsolidated(code: string): Promise<Stock | undefined> {
  const lower = code.toLowerCase();
  const fromDisk = loadStockFile(
    consolidatedStockCache,
    code.toUpperCase(),
    path.join(STOCK_DIR, `${lower}.consolidated.json`),
    code
  );
  if (fromDisk) {
    return fromDisk;
  }

  const cacheKey = code.toUpperCase();
  if (apiConsolidatedCache.has(cacheKey)) {
    return apiConsolidatedCache.get(cacheKey);
  }

  const raw = await fetchEquityConsolidatedRaw(code);
  const stock = raw ? buildStockFromRaw(sanitizeEquityRaw(raw) as RawStock, code) : undefined;
  apiConsolidatedCache.set(cacheKey, stock);
  return stock;
}

export function getPricePoints(code: string): PricePoint[] {
  const cacheKey = code.toUpperCase();
  const cached = pricePointsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const lower = code.toLowerCase();
  const file = path.join(STOCK_DIR, `${lower}_chart_data.csv`);
  if (!fs.existsSync(file)) {
    pricePointsCache.set(cacheKey, []);
    return [];
  }

  const points = rowsToObjects(parseCsvRows(fs.readFileSync(file, "utf8")))
    .map((row) => {
      const open = parseNumericCell(row.Open);
      const high = parseNumericCell(row.High);
      const low = parseNumericCell(row.Low);
      const close = parseNumericCell(row.Close);
      const volume = parseNumericCell(row.Volume);

      if (!row.Date || open === null || high === null || low === null || close === null || volume === null) {
        return null;
      }

      return {
        date: row.Date,
        open,
        high,
        low,
        close,
        volume
      };
    })
    .filter((point): point is PricePoint => Boolean(point));

  pricePointsCache.set(cacheKey, points);
  return points;
}
