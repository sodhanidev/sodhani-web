"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import { companyFinancialsHref, formatIndianNumber, parseNumericCell } from "@/lib/data/format";
import type { FinRow, FinancialTable } from "@/lib/data/types";

type PeriodMode = "quarterly" | "yearly";
type MetricKey = "revenue" | "profit";

type PerformancePoint = {
  period: string;
  revenue: number | null;
  profit: number | null;
};

type ChangeInfo = {
  value: number | null;
  label: "vs previous year" | "vs previous period";
};

const modeLabels: { key: PeriodMode; label: string }[] = [
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" }
];

function hasTable(table: FinancialTable) {
  return table.periods.length > 0 && table.rows.length > 0;
}

function normalizedLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
}

function findRow(table: FinancialTable, labels: string[]): FinRow | undefined {
  const wanted = new Set(labels.map(normalizedLabel));
  return table.rows.find((row) => wanted.has(normalizedLabel(row.label)));
}

function getPointSeries(table: FinancialTable): PerformancePoint[] {
  const revenueRow = findRow(table, ["Sales", "Revenue"]);
  const profitRow = findRow(table, ["Net Profit", "Profit After Tax"]);

  return table.periods
    .map((period) => ({
      period,
      revenue: parseNumericCell(revenueRow?.values[period]),
      profit: parseNumericCell(profitRow?.values[period])
    }))
    .filter((point) => point.revenue !== null || point.profit !== null);
}

function getRecentPoints(points: PerformancePoint[]) {
  return points.slice(-5);
}

function getChangeInfo(points: PerformancePoint[], index: number, key: MetricKey, mode: PeriodMode): ChangeInfo {
  const latest = points[index]?.[key];
  const preferredOffset = mode === "quarterly" ? 4 : 1;
  const fallbackOffset = 1;
  const preferredPrior = points[index - preferredOffset]?.[key];
  const fallbackPrior = points[index - fallbackOffset]?.[key];
  const hasPreferred = preferredPrior !== null && preferredPrior !== undefined;
  const prior = hasPreferred ? preferredPrior : fallbackPrior ?? null;
  const label = hasPreferred || preferredOffset === fallbackOffset ? "vs previous year" : "vs previous period";

  if (latest === null || latest === undefined || prior === null || prior === undefined || prior === 0) {
    return { value: null, label };
  }

  return { value: ((latest - prior) / Math.abs(prior)) * 100, label };
}

function getChange(points: PerformancePoint[], key: MetricKey, mode: PeriodMode) {
  return getChangeInfo(points, points.length - 1, key, mode).value;
}

function getCagr(points: PerformancePoint[], key: MetricKey, mode: PeriodMode) {
  const latestIndex = points.length - 1;
  const latest = points[latestIndex]?.[key];
  const preferredOffset = mode === "quarterly" ? 12 : 3;
  const priorIndex = Math.max(0, latestIndex - preferredOffset);
  const prior = points[priorIndex]?.[key];
  const periods = latestIndex - priorIndex;
  const years = mode === "quarterly" ? periods / 4 : periods;

  if (
    latest === null ||
    latest === undefined ||
    prior === null ||
    prior === undefined ||
    latest <= 0 ||
    prior <= 0 ||
    years <= 0
  ) {
    return null;
  }

  return (Math.pow(latest / prior, 1 / years) - 1) * 100;
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatIndianNumber(value, { dp: 1 })}%`;
}

function formatCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `₹${formatIndianNumber(value)}`;
}

function formatCurrencyForLabel(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "not available";
  }

  return `${formatIndianNumber(value)} crore rupees`;
}

function formatAxis(value: number) {
  if (Math.abs(value) >= 1000) {
    return `${formatIndianNumber(value / 1000, { dp: 0 })}k`;
  }

  return formatIndianNumber(value, { dp: 0 });
}

function toneClass(value: number | null) {
  if (value === null) {
    return "";
  }

  return value >= 0 ? "is-up" : "is-down";
}

export function FinancialPerformance({
  id,
  quarterly,
  ticker,
  yearly
}: {
  id?: string;
  quarterly: FinancialTable;
  ticker: string;
  yearly: FinancialTable;
}) {
  const initialMode = hasTable(quarterly) ? "quarterly" : "yearly";
  const [mode, setMode] = useState<PeriodMode>(initialMode);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  const datasets = {
    quarterly: getPointSeries(quarterly),
    yearly: getPointSeries(yearly)
  };
  const availableModes = modeLabels.filter((candidate) => datasets[candidate.key].length > 0);
  const activeMode = availableModes.some((candidate) => candidate.key === mode) ? mode : availableModes[0]?.key;
  const activePoints = activeMode ? datasets[activeMode] : [];
  const recentPoints = getRecentPoints(activePoints);
  const recentPointEntries = activePoints.map((point, index) => ({ point, index })).slice(-5);

  if (!activeMode || !recentPoints.length) {
    return null;
  }

  const latest = activePoints.at(-1);
  const summaryIndex = activeBarIndex ?? activePoints.length - 1;
  const summaryPoint = activePoints[summaryIndex] ?? latest;
  const summaryRevenueChange = getChangeInfo(activePoints, summaryIndex, "revenue", activeMode);
  const summaryProfitChange = getChangeInfo(activePoints, summaryIndex, "profit", activeMode);
  const maxValue = Math.max(
    1,
    ...recentPoints.flatMap((point) => [Math.abs(point.revenue ?? 0), Math.abs(point.profit ?? 0)])
  );
  const revenueChange = getChange(activePoints, "revenue", activeMode);
  const profitChange = getChange(activePoints, "profit", activeMode);
  const revenueCagr = getCagr(activePoints, "revenue", activeMode);
  const profitCagr = getCagr(activePoints, "profit", activeMode);
  const axisValues = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];

  return (
    <section className={css(styles, `financial-performance${id ? " section-anchor" : ""}`)} id={id}>
      <div className={css(styles, "section-title-row financial-performance-head")}>
        <h2>Financial Performance</h2>
        <Link className={css(styles, "shareholding-detail-link financial-detail-link")} href={companyFinancialsHref(ticker)}>
          All Financials
          <ChevronRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <div className={css(styles, "financial-performance-controls")} aria-label="Financial performance period">
        {availableModes.map((candidate) => (
          <button
            aria-pressed={candidate.key === activeMode}
            className={css(styles, candidate.key === activeMode ? "active" : "")}
            key={candidate.key}
            type="button"
            onClick={() => {
              setMode(candidate.key);
              setActiveBarIndex(null);
            }}
          >
            {candidate.label}
          </button>
        ))}
      </div>

      <div className={css(styles, "financial-chart-card")}>
        <div className={css(styles, "financial-chart-summary")}>
          <div>
            <span>{summaryPoint?.period ?? "Latest"}</span>
            <div className={css(styles, "financial-legend-row")}>
              <span className={css(styles, "financial-legend-dot revenue")} aria-hidden="true" />
              <small>Revenue (Cr)</small>
              <strong className={css(styles, "numeric")}>{formatCurrency(summaryPoint?.revenue ?? null)}</strong>
              <em className={css(styles, `numeric ${toneClass(summaryRevenueChange.value)}`)}>
                {formatPercent(summaryRevenueChange.value)}
              </em>
            </div>
          </div>
          <div>
            <span>{summaryRevenueChange.label}</span>
            <div className={css(styles, "financial-legend-row")}>
              <span className={css(styles, "financial-legend-dot profit")} aria-hidden="true" />
              <small>Profit (Cr)</small>
              <strong className={css(styles, "numeric")}>{formatCurrency(summaryPoint?.profit ?? null)}</strong>
              <em className={css(styles, `numeric ${toneClass(summaryProfitChange.value)}`)}>
                {formatPercent(summaryProfitChange.value)}
              </em>
            </div>
          </div>
        </div>

        <div className={css(styles, "financial-plot")} aria-label={`${activeMode} revenue and profit chart`}>
          <div className={css(styles, "financial-axis-labels")} aria-hidden="true">
            {axisValues.map((value) => (
              <span key={value}>{formatAxis(value)}</span>
            ))}
          </div>
          <div className={css(styles, "financial-bars")}>
            {recentPointEntries.map(({ point, index }) => {
              const revenueHeight = `${Math.max(1, ((point.revenue ?? 0) / maxValue) * 100)}%`;
              const profitHeight = `${Math.max(1, (Math.abs(point.profit ?? 0) / maxValue) * 100)}%`;
              const pointRevenueChange = getChangeInfo(activePoints, index, "revenue", activeMode);
              const pointProfitChange = getChangeInfo(activePoints, index, "profit", activeMode);
              const isActive = activeBarIndex === index;
              const style = {
                "--revenue-height": revenueHeight,
                "--profit-height": profitHeight
              } as CSSProperties;

              return (
                <button
                  aria-label={`${point.period}: revenue ${formatCurrencyForLabel(point.revenue)}, ${formatPercent(
                    pointRevenueChange.value
                  )} ${pointRevenueChange.label}; profit ${formatCurrencyForLabel(point.profit)}, ${formatPercent(
                    pointProfitChange.value
                  )} ${pointProfitChange.label}`}
                  className={css(styles, `financial-bar-group${isActive ? " is-active" : ""}`)}
                  key={point.period}
                  style={style}
                  type="button"
                  onBlur={() => setActiveBarIndex(null)}
                  onFocus={() => setActiveBarIndex(index)}
                  onMouseEnter={() => setActiveBarIndex(index)}
                  onMouseLeave={() => setActiveBarIndex(null)}
                >
                  <span aria-hidden="true" className={css(styles, "financial-bar revenue")} />
                  <span
                    aria-hidden="true"
                    className={css(styles, `financial-bar profit${(point.profit ?? 0) < 0 ? " is-negative" : ""}`)}
                  />
                  <span className={css(styles, "financial-bar-label")}>{point.period}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={css(styles, "financial-growth-grid")}>
        <div>
          <span>Revenue Growth</span>
          <dl>
            <div>
              <dt>{activeMode === "quarterly" ? "YoY" : "1Y"}</dt>
              <dd className={css(styles, `numeric ${toneClass(revenueChange)}`)}>{formatPercent(revenueChange)}</dd>
            </div>
            <div>
              <dt>3Y CAGR</dt>
              <dd className={css(styles, `numeric ${toneClass(revenueCagr)}`)}>{formatPercent(revenueCagr)}</dd>
            </div>
          </dl>
        </div>
        <div>
          <span>Profit Growth</span>
          <dl>
            <div>
              <dt>{activeMode === "quarterly" ? "YoY" : "1Y"}</dt>
              <dd className={css(styles, `numeric ${toneClass(profitChange)}`)}>{formatPercent(profitChange)}</dd>
            </div>
            <div>
              <dt>3Y CAGR</dt>
              <dd className={css(styles, `numeric ${toneClass(profitCagr)}`)}>{formatPercent(profitCagr)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
