// Client for the upstream equity API. The response shape matches the on-disk
// stock_page/*.json shape consumed by getStock(), so a sanitized response can
// be written straight to disk and read back by the existing loader.

export const EQUITY_API_BASE =
  "https://server-production-8226.up.railway.app/api/equity";

// Build the query-param URL the API now expects:
//   /api/equity?code=SUNPHARMA[&consolidated=true]
// The `code` must be uppercase — lowercase codes 404.
function equityUrl(code: string, consolidated: boolean): string {
  const params = new URLSearchParams({ code: code.toUpperCase() });
  if (consolidated) {
    params.set("consolidated", "true");
  }
  return `${EQUITY_API_BASE}?${params.toString()}`;
}

// Loosely typed: we only touch a few fields and pass the rest through verbatim
// so the on-disk shape is preserved for getStock().
export type RawEquity = Record<string, unknown> & {
  overview?: Record<string, unknown>;
  key_metrics?: Record<string, string>;
  quarterly?: Array<Record<string, unknown>>;
};

/**
 * Fetch one ticker from the equity API. Returns undefined when the API has no
 * file for the ticker (404 `{"detail":"Equity file not found"}`) or any other
 * non-200 response.
 */
export async function fetchEquityRaw(code: string): Promise<RawEquity | undefined> {
  const res = await fetch(equityUrl(code, false));
  if (!res.ok) {
    return undefined;
  }
  return (await res.json()) as RawEquity;
}

/**
 * Fetch the CONSOLIDATED variant. The API only has consolidated data for some
 * tickers; returns undefined on 404 (no consolidated file) or any non-200.
 */
export async function fetchEquityConsolidatedRaw(
  code: string
): Promise<RawEquity | undefined> {
  const res = await fetch(equityUrl(code, true));
  if (!res.ok) {
    return undefined;
  }
  return (await res.json()) as RawEquity;
}

function isRawPdfRow(row: Record<string, unknown>): boolean {
  return String(row[""] ?? "").trim() === "Raw PDF";
}

/**
 * Repair the two known upstream data defects, in place-safe fashion:
 *
 *  1. `overview.current_price` carries the Market Cap value, not the price.
 *     The correct price lives in `key_metrics["Current Price"]`, so we source
 *     it from there (falling back to the original if absent).
 *  2. The `quarterly` table has a trailing junk row labelled "Raw PDF" with all
 *     empty values. We drop it.
 *
 * No other field is touched — the returned object keeps the upstream shape so
 * the existing normalizeFinRows()/getStock() mapping consumes it unchanged.
 */
export function sanitizeEquityRaw(raw: RawEquity): RawEquity {
  const correctPrice = raw.key_metrics?.["Current Price"];

  const overview = {
    ...(raw.overview ?? {}),
    current_price: correctPrice ?? raw.overview?.current_price ?? ""
  };

  const quarterly = Array.isArray(raw.quarterly)
    ? raw.quarterly.filter((row) => !isRawPdfRow(row))
    : raw.quarterly;

  return {
    ...raw,
    overview,
    quarterly
  };
}
