"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChartCandlestick, ChevronDown } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company/company.module.css";

import { formatIndianNumber, parseNumericCell } from "@/lib/data/format";
import type { FinRow, FinancialTable, PricePoint } from "@/lib/data/types";

type RangeKey = "1D" | "1W" | "1M" | "6M" | "YTD" | "ALL";
type ChartViewKey = "price" | "sales-margin" | "ev-ebitda" | "price-book" | "market-cap-sales";

type ChartView = {
  key: ChartViewKey;
  label: string;
  unavailableMessage?: string;
};

type SalesMarginPoint = {
  period: string;
  margin: number;
  sales: number;
};

type ValuationMetricKey = "evEbitda" | "priceBook" | "marketCapSales";

type ValuationPoint = {
  bookBasisPeriod: string;
  date: string;
  evEbitda: number | null;
  incomeBasisPeriod: string;
  marketCap: number;
  marketCapSales: number | null;
  price: number;
  priceBook: number | null;
};

const chartColors = {
  positiveLine: "var(--chart-line-positive, var(--up))",
  negativeLine: "var(--chart-line-negative, var(--down))",
  gridLine: "var(--chart-grid-line, var(--line))",
  axisText: "var(--chart-axis-text, var(--ink))",
  hoverLine: "var(--chart-hover-line, var(--muted))"
} as const;

const ranges: { key: RangeKey; label: string }[] = [
  { key: "1D", label: "1D" },
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
  { key: "6M", label: "6M" },
  { key: "YTD", label: "YTD" },
  { key: "ALL", label: "ALL" }
];

const chartViews: ChartView[] = [
  { key: "price", label: "Price" },
  { key: "sales-margin", label: "Sales & margin" },
  { key: "ev-ebitda", label: "EV/EBITDA" },
  { key: "price-book", label: "Price to Book" },
  { key: "market-cap-sales", label: "Market Cap / Sales" }
];

const defaultChartView = chartViews[0]!;

function filterRange(points: PricePoint[], range: RangeKey): PricePoint[] {
  if (range === "1D") {
    return points.slice(-2);
  }
  if (range === "1W") {
    return points.slice(-5);
  }
  if (range === "1M") {
    return points.slice(-22);
  }
  if (range === "6M") {
    return points.slice(-126);
  }
  if (range === "YTD") {
    const latest = points.at(-1);
    if (!latest) {
      return [];
    }

    const year = latest.date.slice(0, 4);
    return points.filter((point) => point.date >= `${year}-01-01`);
  }
  return points;
}

function formatTooltipDate(date: string) {
  const [year, month, day] = date.split("-");
  const monthIndex = Number(month) - 1;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (!year || !day || !months[monthIndex]) {
    return date;
  }

  return `${Number(day)} ${months[monthIndex]} '${year.slice(-2)} · 15:30 IST`;
}

function formatDateTickLabel(date: string, compact = false) {
  const [year, month] = date.split("-");
  const monthIndex = Number(month) - 1;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (!year || !months[monthIndex]) {
    return date;
  }

  return compact ? `${months[monthIndex]} '${year.slice(-2)}` : `${months[monthIndex]} ${year}`;
}

function formatFinancialPeriodLabel(period: string, compact = false) {
  const [month, year] = period.split(/\s+/u);

  if (!month || !year) {
    return period;
  }

  return compact ? `${month} '${year.slice(-2)}` : `${month} ${year}`;
}

function getChartView(key: ChartViewKey) {
  return chartViews.find((view) => view.key === key) ?? defaultChartView;
}

function normalizedLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
}

function findFinancialRow(table: FinancialTable | undefined, labels: string[]): FinRow | undefined {
  if (!table) {
    return undefined;
  }

  const wanted = new Set(labels.map(normalizedLabel));
  const stack = [...table.rows];

  while (stack.length) {
    const row = stack.shift();
    if (!row) {
      continue;
    }

    if (wanted.has(normalizedLabel(row.label))) {
      return row;
    }

    stack.push(...row.children);
  }

  return undefined;
}

function getSalesMarginPoints(table: FinancialTable | undefined): SalesMarginPoint[] {
  const salesRow = findFinancialRow(table, ["Sales", "Revenue"]);
  const marginRow = findFinancialRow(table, ["OPM %", "Operating Profit Margin"]);

  if (!table || !salesRow || !marginRow) {
    return [];
  }

  return table.periods
    .map((period) => {
      const sales = parseNumericCell(salesRow.values[period]);
      const margin = parseNumericCell(marginRow.values[period]);

      if (sales === null || margin === null) {
        return null;
      }

      return { period, sales, margin };
    })
    .filter((point): point is SalesMarginPoint => Boolean(point));
}

function formatPriceValue(value: number) {
  return formatIndianNumber(value, { dp: 2, prefix: "₹" });
}

function formatSalesValue(value: number) {
  return `₹${formatIndianNumber(value)} Cr`;
}

function formatSalesAxis(value: number) {
  if (Math.abs(value) >= 100000) {
    return `₹${formatIndianNumber(value / 100000, { dp: 2 })}L`;
  }

  if (Math.abs(value) >= 1000) {
    return `₹${formatIndianNumber(value / 1000, { dp: 2 })}K`;
  }

  return `₹${formatIndianNumber(value)}`;
}

function formatPercent(value: number, options: { signed?: boolean } = {}) {
  const sign = options.signed && value > 0 ? "+" : "";
  return `${sign}${formatIndianNumber(value, { dp: 1 })}%`;
}

function formatPointChange(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${value > 0 ? "+" : ""}${formatIndianNumber(value, { dp: 1 })}%`;
}

function formatMarginChange(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${value > 0 ? "+" : ""}${formatIndianNumber(value, { dp: 1 })} pp`;
}

function getPercentChange(current: number | null | undefined, previous: number | null | undefined) {
  if (current === null || current === undefined || previous === null || previous === undefined || previous === 0) {
    return null;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

function formatRatioValue(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatIndianNumber(value, { dp: 2 })}x`;
}

function getValuationMetric(viewKey: ChartViewKey): ValuationMetricKey | null {
  if (viewKey === "ev-ebitda") {
    return "evEbitda";
  }

  if (viewKey === "price-book") {
    return "priceBook";
  }

  if (viewKey === "market-cap-sales") {
    return "marketCapSales";
  }

  return null;
}

function getValuationLabel(metric: ValuationMetricKey) {
  if (metric === "evEbitda") {
    return "EV/EBITDA";
  }

  if (metric === "priceBook") {
    return "Price to Book";
  }

  return "Market Cap / Sales";
}

function getValuationTone(metric: ValuationMetricKey) {
  if (metric === "evEbitda") {
    return "ev-ebitda";
  }

  if (metric === "priceBook") {
    return "price-book";
  }

  return "market-cap-sales";
}

function getValuationBasis(point: ValuationPoint, metric: ValuationMetricKey) {
  if (metric === "priceBook") {
    return point.bookBasisPeriod;
  }

  return `${point.incomeBasisPeriod} TTM`;
}

function safeRatio(numerator: number | null | undefined, denominator: number | null | undefined) {
  if (
    numerator === null ||
    numerator === undefined ||
    denominator === null ||
    denominator === undefined ||
    denominator === 0
  ) {
    return null;
  }

  const value = numerator / denominator;
  return Number.isFinite(value) ? value : null;
}

function getFinancialPeriodEndMs(period: string) {
  const [month, year] = period.split(/\s+/u);
  const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(
    month ?? ""
  );
  const yearValue = Number(year);

  if (monthIndex < 0 || !Number.isFinite(yearValue)) {
    return null;
  }

  return Date.UTC(yearValue, monthIndex + 1, 0);
}

function getPriceDateMs(date: string) {
  const value = new Date(`${date}T00:00:00Z`).getTime();
  return Number.isFinite(value) ? value : null;
}

function filterSalesMarginRange(points: SalesMarginPoint[], range: RangeKey, latestPriceDate?: string): SalesMarginPoint[] {
  if (range === "ALL") {
    return points;
  }

  if (range === "6M") {
    return points.slice(-3);
  }

  if (range === "YTD" && latestPriceDate) {
    const latestYear = latestPriceDate.slice(0, 4);
    const filtered = points.filter((point) => {
      const endMs = getFinancialPeriodEndMs(point.period);
      if (endMs === null) {
        return false;
      }

      return new Date(endMs).getUTCFullYear().toString() === latestYear;
    });

    return filtered.length ? filtered : points.slice(-1);
  }

  return points.slice(-1);
}

function getValuationPoints({
  annualFinancials,
  balanceSheet,
  faceValueRaw,
  points,
  quarterlyFinancials
}: {
  annualFinancials?: FinancialTable;
  balanceSheet?: FinancialTable;
  faceValueRaw?: string;
  points: PricePoint[];
  quarterlyFinancials?: FinancialTable;
}): ValuationPoint[] {
  if (!annualFinancials || !balanceSheet || points.length === 0) {
    return [];
  }

  const quarterlySalesRow = findFinancialRow(quarterlyFinancials, ["Sales", "Revenue"]);
  const quarterlyOperatingProfitRow = findFinancialRow(quarterlyFinancials, ["Operating Profit", "EBITDA"]);
  const annualSalesRow = findFinancialRow(annualFinancials, ["Sales", "Revenue"]);
  const annualOperatingProfitRow = findFinancialRow(annualFinancials, ["Operating Profit", "EBITDA"]);
  const equityCapitalRow = findFinancialRow(balanceSheet, ["Equity Capital"]);
  const reservesRow = findFinancialRow(balanceSheet, ["Reserves"]);
  const borrowingsRow = findFinancialRow(balanceSheet, ["Borrowings"]);
  const cashRow = findFinancialRow(balanceSheet, ["Cash Equivalents", "Cash and Cash Equivalents"]);
  const faceValue = parseNumericCell(faceValueRaw) ?? 10;

  if (
    !equityCapitalRow ||
    !reservesRow ||
    !borrowingsRow ||
    faceValue <= 0
  ) {
    return [];
  }

  const balancePeriods = new Set(balanceSheet.periods);
  const bookBases = annualFinancials.periods
    .flatMap((period) => {
      if (!balancePeriods.has(period)) {
        return [];
      }

      const endMs = getFinancialPeriodEndMs(period);
      const equityCapital = parseNumericCell(equityCapitalRow.values[period]);
      const reserves = parseNumericCell(reservesRow.values[period]);
      const borrowings = parseNumericCell(borrowingsRow.values[period]);
      const cash = parseNumericCell(cashRow?.values[period]) ?? 0;

      if (
        endMs === null ||
        equityCapital === null ||
        reserves === null ||
        borrowings === null
      ) {
        return [];
      }

      const sharesOutstandingCr = equityCapital / faceValue;
      const bookValue = equityCapital + reserves;

      return [
        {
          bookValue,
          borrowings,
          cash,
          endMs,
          period,
          sharesOutstandingCr
        }
      ];
    })
    .sort((a, b) => a.endMs - b.endMs);

  const incomeBases =
    quarterlyFinancials && quarterlySalesRow && quarterlyOperatingProfitRow && quarterlyFinancials.periods.length >= 4
      ? quarterlyFinancials.periods
          .flatMap((period, index) => {
            if (index < 3) {
              return [];
            }

            const endMs = getFinancialPeriodEndMs(period);
            const ttmPeriods = quarterlyFinancials.periods.slice(index - 3, index + 1);
            const salesValues = ttmPeriods.map((candidate) => parseNumericCell(quarterlySalesRow.values[candidate]));
            const operatingProfitValues = ttmPeriods.map((candidate) =>
              parseNumericCell(quarterlyOperatingProfitRow.values[candidate])
            );

            if (
              endMs === null ||
              salesValues.some((value) => value === null) ||
              operatingProfitValues.some((value) => value === null)
            ) {
              return [];
            }

            return [
              {
                endMs,
                operatingProfit: operatingProfitValues.reduce<number>((total, value) => total + (value ?? 0), 0),
                period,
                sales: salesValues.reduce<number>((total, value) => total + (value ?? 0), 0)
              }
            ];
          })
          .sort((a, b) => a.endMs - b.endMs)
      : annualFinancials.periods
          .flatMap((period) => {
            const endMs = getFinancialPeriodEndMs(period);
            const sales = parseNumericCell(annualSalesRow?.values[period]);
            const operatingProfit = parseNumericCell(annualOperatingProfitRow?.values[period]);

            if (endMs === null || sales === null || operatingProfit === null) {
              return [];
            }

            return [{ endMs, operatingProfit, period, sales }];
          })
          .sort((a, b) => a.endMs - b.endMs);

  if (!bookBases.length || !incomeBases.length) {
    return [];
  }

  let bookBasisIndex = -1;
  let incomeBasisIndex = -1;

  return points.flatMap((point) => {
    const dateMs = getPriceDateMs(point.date);
    if (dateMs === null) {
      return [];
    }

    while (bookBasisIndex + 1 < bookBases.length && bookBases[bookBasisIndex + 1]!.endMs <= dateMs) {
      bookBasisIndex += 1;
    }

    while (incomeBasisIndex + 1 < incomeBases.length && incomeBases[incomeBasisIndex + 1]!.endMs <= dateMs) {
      incomeBasisIndex += 1;
    }

    const bookBasis = bookBasisIndex >= 0 ? bookBases[bookBasisIndex] : null;
    const incomeBasis = incomeBasisIndex >= 0 ? incomeBases[incomeBasisIndex] : null;
    if (!bookBasis || !incomeBasis) {
      return [];
    }

    const marketCap = point.close * bookBasis.sharesOutstandingCr;
    const enterpriseValue = marketCap + bookBasis.borrowings - bookBasis.cash;

    return [
      {
        bookBasisPeriod: bookBasis.period,
        date: point.date,
        evEbitda: safeRatio(enterpriseValue, incomeBasis.operatingProfit),
        incomeBasisPeriod: incomeBasis.period,
        marketCap,
        marketCapSales: safeRatio(marketCap, incomeBasis.sales),
        price: point.close,
        priceBook: safeRatio(marketCap, bookBasis.bookValue)
      }
    ];
  });
}

export function StockChart({
  advancedHref,
  annualFinancials,
  balanceSheet,
  faceValueRaw,
  id,
  points,
  quarterlyFinancials
}: {
  advancedHref?: string;
  annualFinancials?: FinancialTable;
  balanceSheet?: FinancialTable;
  faceValueRaw?: string;
  id?: string;
  points: PricePoint[];
  quarterlyFinancials?: FinancialTable;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const viewMenuRef = useRef<HTMLDivElement | null>(null);
  const [range, setRange] = useState<RangeKey>("ALL");
  const [viewKey, setViewKey] = useState<ChartViewKey>(defaultChartView.key);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPointerY, setHoverPointerY] = useState<number | null>(null);
  const [chartSize, setChartSize] = useState({ width: 1280, height: 320 });

  useEffect(() => {
    const node = frameRef.current;
    if (!node) {
      return;
    }

    const syncSize = () => {
      const rect = node.getBoundingClientRect();
      const nextSize = {
        width: Math.max(320, Math.round(rect.width)),
        height: Math.max(220, Math.round(rect.height))
      };
      setChartSize((current) =>
        current.width === nextSize.width && current.height === nextSize.height ? current : nextSize
      );
    };

    syncSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncSize);
      return () => window.removeEventListener("resize", syncSize);
    }

    const observer = new ResizeObserver(syncSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!viewMenuOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (viewMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setViewMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [viewMenuOpen]);

  const activeView = getChartView(viewKey);
  const isPriceView = activeView.key === "price";
  const isSalesMarginView = activeView.key === "sales-margin";
  const valuationMetric = getValuationMetric(activeView.key);
  const isValuationView = valuationMetric !== null;
  const visible = useMemo(() => filterRange(points, range), [points, range]);
  const latestPriceDate = points.at(-1)?.date;
  const allSalesMarginPoints = useMemo(
    () => getSalesMarginPoints(quarterlyFinancials ?? annualFinancials),
    [annualFinancials, quarterlyFinancials]
  );
  const salesMarginPoints = useMemo(
    () => filterSalesMarginRange(allSalesMarginPoints, range, latestPriceDate),
    [allSalesMarginPoints, latestPriceDate, range]
  );
  const valuationPoints = useMemo(
    () => getValuationPoints({ annualFinancials, balanceSheet, faceValueRaw, points: visible, quarterlyFinancials }),
    [annualFinancials, balanceSheet, faceValueRaw, quarterlyFinancials, visible]
  );
  const { width, height } = chartSize;
  const compactChart = width < 620;
  const topPad = isSalesMarginView ? (compactChart ? 36 : 30) : isValuationView ? (compactChart ? 32 : 26) : 14;
  const bottomPad = isSalesMarginView ? (compactChart ? 44 : 34) : isValuationView ? (compactChart ? 42 : 34) : 26;
  const priceLeftPad = 4;
  const priceRightPad = compactChart ? 54 : 76;
  const salesLeftPad = compactChart ? 72 : 86;
  const salesRightPad = compactChart ? 58 : 74;
  const valuationLeftPad = salesLeftPad;
  const valuationRightPad = salesRightPad;

  const priceValues = visible.map((point) => point.close);
  const hasPriceData = priceValues.length > 0;
  const priceMin = hasPriceData ? Math.min(...priceValues) : 0;
  const priceMax = hasPriceData ? Math.max(...priceValues) : 0;
  const priceHigh = hasPriceData ? Math.max(...visible.map((point) => point.high)) : 0;
  const priceLow = hasPriceData ? Math.min(...visible.map((point) => point.low)) : 0;
  const priceSpan = Math.max(1, priceMax - priceMin);
  const firstPrice = priceValues[0] ?? 0;
  const latestPrice = priceValues[priceValues.length - 1] ?? 0;
  const positive = visible.length > 1 && latestPrice >= firstPrice;
  const stroke = positive ? chartColors.positiveLine : chartColors.negativeLine;
  const rangeChange = latestPrice - firstPrice;
  const rangePct = firstPrice ? (rangeChange / firstPrice) * 100 : 0;

  const priceCoords = visible.map((point, index) => {
    const x =
      visible.length <= 1
        ? width / 2
        : priceLeftPad + (index / (visible.length - 1)) * (width - priceLeftPad - priceRightPad);
    const y = height - bottomPad - ((point.close - priceMin) / priceSpan) * (height - topPad - bottomPad);
    return { x, y, point };
  });
  const yTickCount = 4;
  const priceYTicks = Array.from({ length: yTickCount }, (_, index) => {
    const value = priceMin + (priceSpan / (yTickCount - 1)) * index;
    const y = height - bottomPad - ((value - priceMin) / priceSpan) * (height - topPad - bottomPad);
    return { value, y };
  }).reverse();
  const priceXTickIndexes = Array.from(
    new Set([
      0,
      Math.floor(visible.length * 0.25),
      Math.floor(visible.length * 0.5),
      Math.floor(visible.length * 0.75),
      visible.length - 1
    ])
  );

  const priceLinePath =
    priceCoords.length <= 1
      ? ""
      : priceCoords.map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`).join(" ");
  const priceAreaPath =
    priceCoords.length <= 1
      ? ""
      : `${priceLinePath} L ${priceCoords[priceCoords.length - 1].x} ${height - bottomPad} L ${
          priceCoords[0].x
        } ${height - bottomPad} Z`;
  const priceHover = hoverIndex === null ? null : priceCoords[hoverIndex] ?? null;

  const hasSalesMarginData = salesMarginPoints.length > 0;
  const latestSalesPoint = hasSalesMarginData ? salesMarginPoints[salesMarginPoints.length - 1] : null;
  const previousSalesPoint = hasSalesMarginData ? salesMarginPoints[salesMarginPoints.length - 2] : null;
  const salesGrowth = getPercentChange(latestSalesPoint?.sales, previousSalesPoint?.sales);
  const marginMove =
    latestSalesPoint && previousSalesPoint ? latestSalesPoint.margin - previousSalesPoint.margin : null;
  const salesRawMax = hasSalesMarginData ? Math.max(1, ...salesMarginPoints.map((point) => point.sales)) : 1;
  const salesAxisMax = salesRawMax * 1.08;
  const rawMarginMin = hasSalesMarginData ? Math.min(...salesMarginPoints.map((point) => point.margin)) : 0;
  const rawMarginMax = hasSalesMarginData ? Math.max(...salesMarginPoints.map((point) => point.margin)) : 1;
  const marginPadding = Math.max(1, (rawMarginMax - rawMarginMin) * 0.22);
  const marginMin = Math.max(0, rawMarginMin - marginPadding);
  const marginMax = rawMarginMax + marginPadding;
  const marginSpan = Math.max(1, marginMax - marginMin);
  const salesPlotWidth = width - salesLeftPad - salesRightPad;
  const salesPlotHeight = height - topPad - bottomPad;
  const salesBarWidth = Math.max(
    compactChart ? 10 : 12,
    Math.min(compactChart ? 22 : 30, (salesPlotWidth / Math.max(1, salesMarginPoints.length)) * 0.36)
  );
  const salesCoords = salesMarginPoints.map((point, index) => {
    const x =
      salesMarginPoints.length <= 1
        ? salesLeftPad + salesPlotWidth / 2
        : salesLeftPad + (index / (salesMarginPoints.length - 1)) * salesPlotWidth;
    const salesHeight = (point.sales / salesAxisMax) * salesPlotHeight;
    const salesY = height - bottomPad - salesHeight;
    const marginY = height - bottomPad - ((point.margin - marginMin) / marginSpan) * salesPlotHeight;
    return { ...point, marginY, salesHeight, salesY, x };
  });
  const salesYTicks = Array.from({ length: yTickCount }, (_, index) => {
    const value = (salesAxisMax / (yTickCount - 1)) * index;
    const y = height - bottomPad - (value / salesAxisMax) * salesPlotHeight;
    return { value, y };
  }).reverse();
  const marginYTicks = Array.from({ length: yTickCount }, (_, index) => {
    const value = marginMin + (marginSpan / (yTickCount - 1)) * index;
    const y = height - bottomPad - ((value - marginMin) / marginSpan) * salesPlotHeight;
    return { value, y };
  }).reverse();
  const fiscalYearSalesTickIndexes = salesMarginPoints.flatMap((point, index) =>
    point.period.startsWith("Mar ") ? [index] : []
  );
  const salesXTickIndexes = Array.from(
    new Set(
      salesMarginPoints.length <= 6
        ? salesMarginPoints.map((_, index) => index)
        : fiscalYearSalesTickIndexes.length >= 2
          ? fiscalYearSalesTickIndexes
          : [0, Math.floor(salesMarginPoints.length * 0.5), salesMarginPoints.length - 1]
    )
  );
  const marginLinePath =
    salesCoords.length <= 1
      ? ""
      : salesCoords.map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.marginY}`).join(" ");
  const marginAreaPath =
    salesCoords.length <= 1
      ? ""
      : `${marginLinePath} L ${salesCoords[salesCoords.length - 1]!.x} ${height - bottomPad} L ${
          salesCoords[0]!.x
        } ${height - bottomPad} Z`;
  const salesHover = hoverIndex === null ? null : salesCoords[hoverIndex] ?? null;

  const valuationSeries = valuationMetric
    ? valuationPoints.flatMap((point) => {
        const value = point[valuationMetric];
        return value === null ? [] : [{ ...point, value }];
      })
    : [];
  const hasValuationData = valuationSeries.length > 0;
  const latestValuationPoint = hasValuationData ? valuationSeries[valuationSeries.length - 1] : null;
  const previousValuationPoint = hasValuationData ? valuationSeries[valuationSeries.length - 2] : null;
  const valuationChange = getPercentChange(latestValuationPoint?.value, previousValuationPoint?.value);
  const valuationValues = valuationSeries.map((point) => point.value);
  const rawValuationMin = hasValuationData ? Math.min(...valuationValues) : 0;
  const rawValuationMax = hasValuationData ? Math.max(...valuationValues) : 1;
  const valuationPadding = Math.max(0.1, (rawValuationMax - rawValuationMin) * 0.15);
  const valuationMin = Math.max(0, rawValuationMin - valuationPadding);
  const valuationMax = rawValuationMax + valuationPadding;
  const valuationSpan = Math.max(1, valuationMax - valuationMin);
  const valuationPlotWidth = width - valuationLeftPad - valuationRightPad;
  const valuationPlotHeight = height - topPad - bottomPad;
  const marketCapMax = hasValuationData ? Math.max(1, ...valuationSeries.map((point) => point.marketCap)) : 1;
  const valuationBarWidth = Math.max(
    1.5,
    Math.min(18, (valuationPlotWidth / Math.max(1, valuationSeries.length)) * 0.55)
  );
  const valuationCoords = valuationSeries.map((point, index) => {
    const x =
      valuationSeries.length <= 1
        ? valuationLeftPad + valuationPlotWidth / 2
        : valuationLeftPad + (index / (valuationSeries.length - 1)) * valuationPlotWidth;
    const y = height - bottomPad - ((point.value - valuationMin) / valuationSpan) * valuationPlotHeight;
    const marketCapHeight = (point.marketCap / marketCapMax) * valuationPlotHeight;
    const marketCapY = height - bottomPad - marketCapHeight;
    return { ...point, marketCapHeight, marketCapY, x, y };
  });
  const marketCapYTicks = Array.from({ length: yTickCount }, (_, index) => {
    const value = (marketCapMax / (yTickCount - 1)) * index;
    const y = height - bottomPad - (value / marketCapMax) * valuationPlotHeight;
    return { value, y };
  }).reverse();
  const valuationYTicks = Array.from({ length: yTickCount }, (_, index) => {
    const value = valuationMin + (valuationSpan / (yTickCount - 1)) * index;
    const y = height - bottomPad - ((value - valuationMin) / valuationSpan) * valuationPlotHeight;
    return { value, y };
  }).reverse();
  const valuationXTickIndexes = Array.from(
    new Set(
      valuationSeries.length <= 6
        ? valuationSeries.map((_, index) => index)
        : [
            0,
            Math.floor(valuationSeries.length * 0.25),
            Math.floor(valuationSeries.length * 0.5),
            Math.floor(valuationSeries.length * 0.75),
            valuationSeries.length - 1
          ]
    )
  );
  const valuationLinePath =
    valuationCoords.length <= 1
      ? ""
      : valuationCoords.map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`).join(" ");
  const valuationHover = hoverIndex === null ? null : valuationCoords[hoverIndex] ?? null;
  const activePointCount = isSalesMarginView ? salesMarginPoints.length : isValuationView ? valuationSeries.length : visible.length;
  const activeLeftPad = isSalesMarginView ? salesLeftPad : isValuationView ? valuationLeftPad : priceLeftPad;
  const activeRightPad = isSalesMarginView ? salesRightPad : isValuationView ? valuationRightPad : priceRightPad;
  const activeHover = isSalesMarginView ? salesHover : isValuationView ? valuationHover : priceHover;
  const activeHoverY = isSalesMarginView
    ? salesHover?.marginY ?? 0
    : isValuationView
      ? valuationHover?.y ?? 0
      : priceHover?.y ?? 0;
  const tooltipY = activeHover
    ? Math.min(height - bottomPad - 34, Math.max(topPad + 34, hoverPointerY ?? activeHoverY))
    : 0;
  const hoverSide = activeHover && activeHover.x > width - activeRightPad - 150 ? "left" : "right";
  const rangeTone = rangePct >= 0 ? "up" : "down";
  const salesGrowthTone = salesGrowth === null ? "" : salesGrowth >= 0 ? "up" : "down";
  const marginMoveTone = marginMove === null ? "" : marginMove >= 0 ? "up" : "down";
  const valuationChangeTone = valuationChange === null ? "" : valuationChange >= 0 ? "up" : "down";
  const valuationTone = valuationMetric ? getValuationTone(valuationMetric) : "";
  const selectChartView = (nextView: ChartViewKey) => {
    setViewKey(nextView);
    if (nextView === "sales-margin") {
      setRange("ALL");
    }
    setHoverIndex(null);
    setHoverPointerY(null);
    setViewMenuOpen(false);
  };

  return (
    <section className={css(styles, `chart-surface chart-${activeView.key}${id ? " section-anchor" : ""}`)} id={id}>
      <div className={css(styles, "chart-meta-row")}>
        <div className={css(styles, "chart-stats")} aria-label="Chart summary">
          {isPriceView && hasPriceData ? (
            <>
              <div>
                <span>High</span>
                <strong className={css(styles, "numeric")}>{formatPriceValue(priceHigh)}</strong>
              </div>
              <div>
                <span>Low</span>
                <strong className={css(styles, "numeric")}>{formatPriceValue(priceLow)}</strong>
              </div>
              <div>
                <span>Returns</span>
                <strong className={css(styles, `numeric ${rangeTone}`)}>
                  {rangePct >= 0 ? "+" : ""}
                  {formatIndianNumber(rangePct, { dp: 2 })}%
                </strong>
              </div>
            </>
          ) : null}
          {isSalesMarginView && latestSalesPoint ? (
            <>
              <div>
                <span>Sales</span>
                <strong className={css(styles, "numeric")}>{formatSalesValue(latestSalesPoint.sales)}</strong>
              </div>
              <div>
                <span>OPM</span>
                <strong className={css(styles, "numeric")}>{formatPercent(latestSalesPoint.margin)}</strong>
              </div>
              <div>
                <span>Sales growth</span>
                <strong className={css(styles, `numeric ${salesGrowthTone}`)}>{formatPointChange(salesGrowth)}</strong>
              </div>
              <div>
                <span>Margin change</span>
                <strong className={css(styles, `numeric ${marginMoveTone}`)}>{formatMarginChange(marginMove)}</strong>
              </div>
            </>
          ) : null}
          {isValuationView && latestValuationPoint && valuationMetric ? (
            <>
              <div>
                <span>{getValuationLabel(valuationMetric)}</span>
                <strong className={css(styles, "numeric")}>{formatRatioValue(latestValuationPoint.value)}</strong>
              </div>
              <div>
                <span>Basis</span>
                <strong>{getValuationBasis(latestValuationPoint, valuationMetric)}</strong>
              </div>
              <div>
                <span>Change</span>
                <strong className={css(styles, `numeric ${valuationChangeTone}`)}>
                  {formatPointChange(valuationChange)}
                </strong>
              </div>
            </>
          ) : null}
          {isValuationView && !latestValuationPoint ? (
            <div>
              <span>Status</span>
              <strong>Data needed</strong>
            </div>
          ) : null}
        </div>
        <div className={css(styles, "chart-actions")}>
          <div className={css(styles, "range-toggle chart-ranges")} aria-label="Chart range">
            {ranges.map((candidate) => (
              <button
                aria-pressed={candidate.key === range}
                className={css(styles, candidate.key === range ? "active" : "")}
                key={candidate.key}
                type="button"
                onClick={() => {
                  setRange(candidate.key);
                  setHoverIndex(null);
                  setHoverPointerY(null);
                }}
              >
                {candidate.label}
              </button>
            ))}
          </div>
          <div ref={viewMenuRef} className={css(styles, `chart-view-menu${viewMenuOpen ? " open" : ""}`)}>
            <button
              aria-expanded={viewMenuOpen}
              aria-haspopup="listbox"
              className={css(styles, "chart-view-trigger")}
              type="button"
              onClick={() => setViewMenuOpen((open) => !open)}
            >
              <span>{activeView.label}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {viewMenuOpen ? (
              <div className={css(styles, "chart-view-options")} role="listbox" aria-label="Chart view">
                {chartViews.map((view) => (
                  <button
                    aria-selected={view.key === viewKey}
                    className={css(styles, view.key === viewKey ? "active" : "")}
                    key={view.key}
                    role="option"
                    type="button"
                    onClick={() => selectChartView(view.key)}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className={css(styles, "chart-body")}>
        <div
          ref={frameRef}
          className={css(styles, "chart-frame")}
          onMouseLeave={() => {
            setHoverIndex(null);
            setHoverPointerY(null);
          }}
          onMouseMove={(event) => {
            if (activePointCount <= 1) {
              setHoverIndex(null);
              setHoverPointerY(null);
              return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const chartX = ((event.clientX - rect.left) / rect.width) * width;
            const chartY = ((event.clientY - rect.top) / rect.height) * height;
            const plotRight = width - activeRightPad;

            if (chartX < activeLeftPad || chartX > plotRight) {
              setHoverIndex(null);
              setHoverPointerY(null);
              return;
            }

            const ratio = (chartX - activeLeftPad) / (width - activeLeftPad - activeRightPad);
            const nextIndex = Math.round(ratio * (activePointCount - 1));
            setHoverIndex(Math.max(0, Math.min(activePointCount - 1, nextIndex)));
            setHoverPointerY(Math.min(height - bottomPad, Math.max(topPad, chartY)));
          }}
        >
          {isPriceView && !hasPriceData ? <div className={css(styles, "empty-state")}>No price data available</div> : null}
          {isPriceView && priceCoords.length <= 1 && visible[0] ? (
            <div className={css(styles, "panel-pad")}>
              <div className={css(styles, "eyebrow")}>{visible[0].date}</div>
              <div className={css(styles, "price-value")}>{formatPriceValue(visible[0].close)}</div>
              <p className={css(styles, "muted numeric")}>Vol {formatIndianNumber(visible[0].volume)}</p>
            </div>
          ) : null}
          {isPriceView && priceCoords.length > 1 ? (
            <>
              <svg preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Close price chart">
                <defs>
                  <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity="0.14" />
                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {priceYTicks.map((tick, index) => (
                  <g key={tick.value}>
                    {index > 0 && index < priceYTicks.length - 1 ? (
                      <line
                        x1={priceLeftPad}
                        x2={width - priceRightPad}
                        y1={tick.y}
                        y2={tick.y}
                        stroke={chartColors.gridLine}
                      />
                    ) : null}
                    <text x={width - priceRightPad + 14} y={tick.y + 4} fill={chartColors.axisText} fontSize="11">
                      {formatPriceValue(tick.value)}
                    </text>
                  </g>
                ))}
                {priceXTickIndexes.map((index) => {
                  const coord = priceCoords[index];
                  if (!coord) {
                    return null;
                  }
                  const isFirst = index === 0;
                  const isLast = index === visible.length - 1;
                  return (
                    <text
                      fill={chartColors.axisText}
                      fontSize="11"
                      key={coord.point.date}
                      textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                      x={coord.x}
                      y={height - 5}
                    >
                      {coord.point.date.slice(5)}
                    </text>
                  );
                })}
                <path d={priceAreaPath} fill="url(#chartFill)" />
                <path d={priceLinePath} fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="2.1" />
                {priceHover ? (
                  <>
                    <line
                      x1={priceLeftPad}
                      x2={width - priceRightPad}
                      y1={priceHover.y}
                      y2={priceHover.y}
                      stroke={chartColors.hoverLine}
                      strokeDasharray="1 5"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={priceHover.x}
                      x2={priceHover.x}
                      y1={topPad}
                      y2={height - bottomPad}
                      stroke={chartColors.hoverLine}
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle cx={priceHover.x} cy={priceHover.y} fill={stroke} r="4" />
                  </>
                ) : null}
              </svg>
              {priceHover ? (
                <div
                  className={css(styles, "chart-tooltip")}
                  data-side={hoverSide}
                  style={{ left: `${(priceHover.x / width) * 100}%`, top: `${(tooltipY / height) * 100}%` }}
                >
                  <div className={css(styles, "chart-tooltip-price")}>{formatPriceValue(priceHover.point.close)}</div>
                  <div className={css(styles, "chart-tooltip-meta")}>{formatTooltipDate(priceHover.point.date)}</div>
                </div>
              ) : null}
            </>
          ) : null}
          {isSalesMarginView && !hasSalesMarginData ? (
            <div className={css(styles, "empty-state")}>No sales and margin data available</div>
          ) : null}
          {isSalesMarginView && hasSalesMarginData ? (
            <>
              <svg preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sales and margin chart">
                <defs>
                  <linearGradient id="salesMarginFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-2)" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {salesYTicks.map((tick, index) => (
                  <g key={tick.value}>
                    {index > 0 && index < salesYTicks.length - 1 ? (
                      <line
                        x1={salesLeftPad}
                        x2={width - salesRightPad}
                        y1={tick.y}
                        y2={tick.y}
                        stroke={chartColors.gridLine}
                      />
                    ) : null}
                    <text
                      x={salesLeftPad - 12}
                      y={tick.y + 4}
                      fill={chartColors.axisText}
                      fontSize="11"
                      textAnchor="end"
                    >
                      {formatSalesAxis(tick.value)}
                    </text>
                  </g>
                ))}
                {marginYTicks.map((tick) => (
                  <text
                    fill={chartColors.axisText}
                    fontSize="11"
                    key={tick.value}
                    x={width - salesRightPad + 12}
                    y={tick.y + 4}
                  >
                    {formatPercent(tick.value)}
                  </text>
                ))}
                {salesXTickIndexes.map((index) => {
                  const coord = salesCoords[index];
                  if (!coord) {
                    return null;
                  }
                  const isFirst = index === 0;
                  const isLast = index === salesCoords.length - 1;
                  return (
                    <text
                      fill={chartColors.axisText}
                      fontSize="11"
                      key={coord.period}
                      textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                      x={coord.x}
                      y={height - 5}
                    >
                      {formatFinancialPeriodLabel(coord.period, compactChart)}
                    </text>
                  );
                })}
                {salesCoords.map((coord) => (
                  <rect
                    className={css(styles, "chart-sales-bar")}
                    height={coord.salesHeight}
                    key={coord.period}
                    rx="3"
                    vectorEffect="non-scaling-stroke"
                    width={salesBarWidth}
                    x={coord.x - salesBarWidth / 2}
                    y={coord.salesY}
                  />
                ))}
                {marginAreaPath ? <path className={css(styles, "chart-margin-area")} d={marginAreaPath} fill="url(#salesMarginFill)" /> : null}
                <path
                  className={css(styles, "chart-margin-line")}
                  d={marginLinePath}
                  fill="none"
                  strokeLinecap="round"
                  strokeWidth="2.1"
                />
                {salesCoords.map((coord) => (
                  <circle
                    className={css(styles, "chart-margin-dot")}
                    cx={coord.x}
                    cy={coord.marginY}
                    key={coord.period}
                    r={salesHover?.period === coord.period ? "4" : "3"}
                  />
                ))}
                {salesHover ? (
                  <>
                    <line
                      x1={salesHover.x}
                      x2={salesHover.x}
                      y1={topPad}
                      y2={height - bottomPad}
                      stroke={chartColors.hoverLine}
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={salesLeftPad}
                      x2={width - salesRightPad}
                      y1={salesHover.marginY}
                      y2={salesHover.marginY}
                      stroke={chartColors.hoverLine}
                      strokeDasharray="1 5"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                ) : null}
              </svg>
              {salesHover ? (
                <div
                  className={css(styles, "chart-tooltip")}
                  data-side={hoverSide}
                  style={{ left: `${(salesHover.x / width) * 100}%`, top: `${(tooltipY / height) * 100}%` }}
                >
                  <div className={css(styles, "chart-tooltip-price")}>{formatSalesValue(salesHover.sales)}</div>
                  <div className={css(styles, "chart-tooltip-meta")}>
                    {salesHover.period} · OPM {formatPercent(salesHover.margin)}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
          {isValuationView && !hasValuationData ? (
            <div className={css(styles, "empty-state")}>Not enough price and annual financial data to derive this ratio.</div>
          ) : null}
          {isValuationView && hasValuationData && valuationMetric ? (
            <>
              <svg
                preserveAspectRatio="none"
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label={`${getValuationLabel(valuationMetric)} chart`}
              >
                <defs>
                  <linearGradient id="valuationChartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={chartColors.positiveLine} stopOpacity="0.11" />
                    <stop offset="100%" stopColor={chartColors.positiveLine} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {marketCapYTicks.map((tick, index) => (
                  <g key={tick.value}>
                    {index > 0 && index < marketCapYTicks.length - 1 ? (
                      <line
                        x1={valuationLeftPad}
                        x2={width - valuationRightPad}
                        y1={tick.y}
                        y2={tick.y}
                        stroke={chartColors.gridLine}
                      />
                    ) : null}
                    <text
                      x={valuationLeftPad - 12}
                      y={tick.y + 4}
                      fill={chartColors.axisText}
                      fontSize="11"
                      textAnchor="end"
                    >
                      {formatSalesAxis(tick.value)}
                    </text>
                  </g>
                ))}
                {valuationYTicks.map((tick) => (
                  <text
                    x={width - valuationRightPad + 12}
                    y={tick.y + 4}
                    fill={chartColors.axisText}
                    fontSize="11"
                    key={tick.value}
                  >
                    {formatRatioValue(tick.value)}
                  </text>
                ))}
                {valuationXTickIndexes.map((index) => {
                  const coord = valuationCoords[index];
                  if (!coord) {
                    return null;
                  }
                  const isFirst = index === 0;
                  const isLast = index === valuationCoords.length - 1;
                  return (
                    <text
                      fill={chartColors.axisText}
                      fontSize="11"
                      key={coord.date}
                      textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                      x={coord.x}
                      y={height - 5}
                    >
                      {formatDateTickLabel(coord.date, compactChart)}
                    </text>
                  );
                })}
                {valuationCoords.map((coord) => (
                  <rect
                    className={css(styles, `chart-valuation-bar ${valuationTone}`)}
                    height={coord.marketCapHeight}
                    key={coord.date}
                    width={valuationBarWidth}
                    x={coord.x - valuationBarWidth / 2}
                    y={coord.marketCapY}
                  />
                ))}
                {valuationLinePath ? (
                  <>
                    <path
                      d={`${valuationLinePath} L ${valuationCoords[valuationCoords.length - 1]?.x ?? 0} ${
                        height - bottomPad
                      } L ${valuationCoords[0]?.x ?? 0} ${height - bottomPad} Z`}
                      fill="url(#valuationChartFill)"
                    />
                    <path
                      className={css(styles, `chart-valuation-line ${valuationTone}`)}
                      d={valuationLinePath}
                      fill="none"
                      strokeLinecap="round"
                      strokeWidth="2.1"
                    />
                  </>
                ) : null}
                {valuationCoords.map((coord) => (
                  <circle
                    className={css(styles, `chart-valuation-dot ${valuationTone}`)}
                    cx={coord.x}
                    cy={coord.y}
                    key={coord.date}
                    r={valuationHover?.date === coord.date ? "4" : "3"}
                  />
                ))}
                {valuationHover ? (
                  <>
                    <line
                      x1={valuationHover.x}
                      x2={valuationHover.x}
                      y1={topPad}
                      y2={height - bottomPad}
                      stroke={chartColors.hoverLine}
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={valuationLeftPad}
                      x2={width - valuationRightPad}
                      y1={valuationHover.y}
                      y2={valuationHover.y}
                      stroke={chartColors.hoverLine}
                      strokeDasharray="1 5"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                ) : null}
              </svg>
              {valuationHover ? (
                <div
                  className={css(styles, "chart-tooltip")}
                  data-side={hoverSide}
                  style={{ left: `${(valuationHover.x / width) * 100}%`, top: `${(tooltipY / height) * 100}%` }}
                >
                  <div className={css(styles, "chart-tooltip-price")}>{formatRatioValue(valuationHover.value)}</div>
                  <div className={css(styles, "chart-tooltip-meta")}>
                    {formatTooltipDate(valuationHover.date)} · {getValuationBasis(valuationHover, valuationMetric)}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      {advancedHref && isPriceView ? (
        <div className={css(styles, "chart-footer-actions")}>
          <Link className={css(styles, "chart-advanced-link")} href={advancedHref}>
            <ChartCandlestick size={15} aria-hidden="true" />
            Advanced
          </Link>
        </div>
      ) : null}
      <div className={css(styles, "sr-only")}>
        {isPriceView ? (
          <table>
            <caption>Close prices</caption>
            <tbody>
              {visible.map((point) => (
                <tr key={point.date}>
                  <th>{point.date}</th>
                  <td>{point.close}</td>
                  <td>{point.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {isSalesMarginView ? (
          <table>
            <caption>Sales and margin</caption>
            <tbody>
              {salesMarginPoints.map((point) => (
                <tr key={point.period}>
                  <th>{point.period}</th>
                  <td>{point.sales}</td>
                  <td>{point.margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {isValuationView && valuationMetric ? (
          <table>
            <caption>{getValuationLabel(valuationMetric)}</caption>
            <tbody>
              {valuationSeries.map((point) => (
                <tr key={point.date}>
                  <th>{point.date}</th>
                  <td>{point.value}</td>
                  <td>{point.marketCap}</td>
                  <td>{point.price}</td>
                  <td>{getValuationBasis(point, valuationMetric)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}
