import type { FinancialTable } from "@/lib/data/types";

// Period windowing — shared so financials, shareholding tables, and the
// shareholding pie chart all show the same recent date range.
export const QUARTERLY_RESULT_PERIODS = 8;
export const ANNUAL_RESULT_PERIODS = 7;

export function isQuarterlyPeriods(periods: string[]): boolean {
  return periods.some((period) => !period.startsWith("Mar "));
}

export function recentPeriods(periods: string[]): string[] {
  const maxPeriods = isQuarterlyPeriods(periods) ? QUARTERLY_RESULT_PERIODS : ANNUAL_RESULT_PERIODS;
  return periods.slice(-maxPeriods);
}

export function limitTablePeriods(table: FinancialTable, maxPeriods?: number): FinancialTable {
  const max = maxPeriods ?? (isQuarterlyPeriods(table.periods) ? QUARTERLY_RESULT_PERIODS : ANNUAL_RESULT_PERIODS);
  return {
    ...table,
    periods: table.periods.slice(-max)
  };
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function cleanDisplayName(value: string): string {
  return normalizeWhitespace(value).replace(/\s+IN\d{4,}$/u, "").trim();
}

export function parseNumericCell(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/[₹,%]/g, "")
    .replace(/\s+/g, "")
    .replace(/^\((.*)\)$/u, "-$1")
    .trim();

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatIndianNumber(
  value: number | null | undefined,
  options: { dp?: number; prefix?: string; suffix?: string } = {}
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  const formatter = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: options.dp ?? 0,
    maximumFractionDigits: options.dp ?? 0
  });

  return `${options.prefix ?? ""}${formatter.format(value)}${options.suffix ?? ""}`;
}

export function formatMetric(
  value: number | null,
  kind: "currency" | "number" | "percent" | "crore"
): string {
  if (value === null) {
    return "-";
  }

  if (kind === "currency") {
    return formatIndianNumber(value, { dp: 2, prefix: "₹ " });
  }

  if (kind === "percent") {
    return formatIndianNumber(value, { dp: 2, suffix: "%" });
  }

  if (kind === "crore") {
    return formatIndianNumber(value, { dp: 0, prefix: "₹ ", suffix: " Cr." });
  }

  return formatIndianNumber(value, { dp: 2 });
}

export function compactHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./u, "");
  } catch {
    return "external";
  }
}

export function marketHref(path: string[], page?: number): string {
  const base = `/market/${path.join("/")}`;
  if (page && page > 1) {
    return `${base}/page/${page}/`;
  }
  return path.length ? `${base}/` : "/market/";
}

export function companyHref(code: string): string {
  return `/company/${encodeURIComponent(code)}/`;
}

export function companyShareholdingHref(code: string): string {
  return `${companyHref(code)}shareholding/`;
}

export function companyFinancialsHref(code: string): string {
  return `${companyHref(code)}financials/`;
}

export function companyCandlestickHref(code: string): string {
  return `${companyHref(code)}candlestick/`;
}

export function candlestickToolHref(): string {
  return "/tools/candlestick/";
}
