import fs from "node:fs";
import path from "node:path";

import { parseCsvRows, rowsToObjects } from "./csv";
import { parseNumericCell } from "./format";
import type { FinRow, FinancialTable, PricePoint, Stock } from "./types";

const STOCK_DIR = path.join(process.cwd(), "stock_page");

type RawFinRow = Record<string, string | boolean | RawFinRow[] | undefined>;

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
  return fs
    .readdirSync(STOCK_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/u, "").toUpperCase());
}

export function getStock(code: string): Stock | undefined {
  const lower = code.toLowerCase();
  const file = path.join(STOCK_DIR, `${lower}.json`);
  if (!fs.existsSync(file)) {
    return undefined;
  }

  const raw = JSON.parse(fs.readFileSync(file, "utf8"));

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

export function getPricePoints(code: string): PricePoint[] {
  const lower = code.toLowerCase();
  const file = path.join(STOCK_DIR, `${lower}_chart_data.csv`);
  if (!fs.existsSync(file)) {
    return [];
  }

  return rowsToObjects(parseCsvRows(fs.readFileSync(file, "utf8"))).map((row) => ({
    date: row.Date,
    open: parseNumericCell(row.Open) ?? 0,
    high: parseNumericCell(row.High) ?? 0,
    low: parseNumericCell(row.Low) ?? 0,
    close: parseNumericCell(row.Close) ?? 0,
    volume: parseNumericCell(row.Volume) ?? 0
  }));
}
