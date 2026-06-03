"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import { companyFinancialsHref, formatIndianNumber, parseNumericCell } from "@/lib/data/format";
import type { FinRow, FinancialTable } from "@/lib/data/types";

// Parked for now. This is the experimental Financials overview with net margin
// and debt coverage charts; the live company page has been restored to the older
// FinancialPerformance component until this gets revisited.
type PeriodMode = "yearly" | "quarterly";

type ChartMetric = {
  key: string;
  label: string;
  className: string;
};

type ChartPoint = {
  period: string;
  bars: Record<string, number | null>;
  line?: number | null;
};

type Scale = {
  max: number;
  min: number;
  range: number;
};

const modeLabels: { key: PeriodMode; label: string }[] = [
  { key: "yearly", label: "Annual" },
  { key: "quarterly", label: "Quarterly" }
];

const performanceMetrics: ChartMetric[] = [
  { key: "revenue", label: "Revenue", className: "revenue" },
  { key: "profit", label: "Net income", className: "profit" }
];

const debtMetrics: ChartMetric[] = [
  { key: "debt", label: "Debt", className: "debt" },
  { key: "freeCashFlow", label: "Free cash flow", className: "free-cash-flow" },
  { key: "cashEquivalents", label: "Cash & equivalents", className: "cash-equivalents" }
];

function hasTable(table: FinancialTable) {
  return table.periods.length > 0 && table.rows.length > 0;
}

function normalizedLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
}

function findRowInRows(rows: FinRow[], labels: Set<string>): FinRow | undefined {
  for (const row of rows) {
    if (labels.has(normalizedLabel(row.label))) {
      return row;
    }

    const child = findRowInRows(row.children, labels);
    if (child) {
      return child;
    }
  }

  return undefined;
}

function findRow(table: FinancialTable, labels: string[]): FinRow | undefined {
  return findRowInRows(table.rows, new Set(labels.map(normalizedLabel)));
}

function getPerformanceSeries(table: FinancialTable): ChartPoint[] {
  const revenueRow = findRow(table, ["Sales", "Revenue"]);
  const profitRow = findRow(table, ["Net Profit", "Profit After Tax"]);

  return table.periods
    .map((period) => {
      const revenue = parseNumericCell(revenueRow?.values[period]);
      const profit = parseNumericCell(profitRow?.values[period]);

      return {
        period,
        bars: {
          revenue,
          profit
        },
        line: revenue !== null && revenue !== 0 && profit !== null ? (profit / revenue) * 100 : null
      };
    })
    .filter((point) => point.bars.revenue !== null || point.bars.profit !== null);
}

function getDebtSeries(balanceSheet: FinancialTable, cashFlows: FinancialTable): ChartPoint[] {
  const debtRow = findRow(balanceSheet, ["Borrowings", "Debt"]);
  const cashEquivalentsRow = findRow(balanceSheet, ["Cash Equivalents", "Cash & Equivalents"]);
  const freeCashFlowRow = findRow(cashFlows, ["Free Cash Flow"]);

  return balanceSheet.periods
    .map((period) => ({
      period,
      bars: {
        debt: parseNumericCell(debtRow?.values[period]),
        freeCashFlow: parseNumericCell(freeCashFlowRow?.values[period]),
        cashEquivalents: parseNumericCell(cashEquivalentsRow?.values[period])
      }
    }))
    .filter((point) => Object.values(point.bars).some((value) => value !== null));
}

function recent(points: ChartPoint[]) {
  return points.slice(-5);
}

function formatPeriodLabel(period: string, mode: PeriodMode) {
  const year = period.match(/\b(20\d{2}|19\d{2})\b/u)?.[1];

  if (mode === "yearly" && year) {
    return year;
  }

  if (year) {
    return period.replace(year, `'${year.slice(-2)}`);
  }

  return period;
}

function formatAxisCurrency(value: number) {
  const abs = Math.abs(value);

  if (abs >= 100000) {
    return `${formatIndianNumber(value / 100000, { dp: 1 })}L Cr`;
  }

  if (abs >= 1000) {
    return `${formatIndianNumber(value / 1000, { dp: 0 })}k Cr`;
  }

  return `${formatIndianNumber(value, { dp: 0 })} Cr`;
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatIndianNumber(value, { dp: 1 })}%`;
}

function formatValueForLabel(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "not available";
  }

  return `${formatIndianNumber(value)} crore rupees`;
}

function makeValueScale(points: ChartPoint[], metrics: ChartMetric[]): Scale {
  const values = points
    .flatMap((point) => metrics.map((metric) => point.bars[metric.key]))
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const rawMax = Math.max(0, ...values);
  const rawMin = Math.min(0, ...values);
  const span = Math.max(1, rawMax - rawMin);
  const max = rawMax + span * 0.1;
  const min = rawMin < 0 ? rawMin - span * 0.1 : 0;

  return { max, min, range: Math.max(1, max - min) };
}

function makeLineScale(points: ChartPoint[]): Scale | null {
  const values = points.map((point) => point.line).filter((value): value is number => value !== null && Number.isFinite(value));

  if (values.length < 2) {
    return null;
  }

  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const span = Math.max(1, rawMax - rawMin);
  const max = rawMax + span * 0.18;
  const min = rawMin - span * 0.18;

  return { max, min, range: Math.max(1, max - min) };
}

function axisValues(scale: Scale) {
  return Array.from({ length: 5 }, (_, index) => scale.max - (scale.range / 4) * index);
}

function barStyle(value: number | null, scale: Scale): CSSProperties {
  if (value === null || !Number.isFinite(value)) {
    return {
      "--bar-height": "0%",
      "--bar-top": "100%"
    } as CSSProperties;
  }

  const zeroY = ((scale.max - 0) / scale.range) * 100;
  const valueY = ((scale.max - value) / scale.range) * 100;
  const top = Math.min(zeroY, valueY);
  const height = Math.max(0.6, Math.abs(zeroY - valueY));

  return {
    "--bar-height": `${height}%`,
    "--bar-top": `${top}%`
  } as CSSProperties;
}

function linePoints(points: ChartPoint[], scale: Scale | null) {
  if (!scale) {
    return [];
  }

  return points.flatMap((point, index) => {
    if (point.line === null || point.line === undefined || !Number.isFinite(point.line)) {
      return [];
    }

    return [
      {
        period: point.period,
        x: ((index + 0.5) / points.length) * 100,
        y: ((scale.max - point.line) / scale.range) * 100
      }
    ];
  });
}

function lineSegments(points: ChartPoint[], scale: Scale | null) {
  const plottedPoints = linePoints(points, scale);

  return plottedPoints.slice(0, -1).map((point, index) => ({
    from: point,
    to: plottedPoints[index + 1]
  }));
}

function InfoTooltip({ children }: { children: string }) {
  return (
    <span className={css(styles, "financial-help")}>
      <button aria-label={children} type="button">
        ?
      </button>
      <span className={css(styles, "financial-help-tooltip")} role="tooltip">
        {children}
      </span>
    </span>
  );
}

function FinancialMiniChart({
  activeMode,
  datasets,
  help,
  lineLabel,
  metrics,
  onModeChange,
  title
}: {
  activeMode: PeriodMode;
  datasets: Record<PeriodMode, ChartPoint[]>;
  help: string;
  lineLabel?: string;
  metrics: ChartMetric[];
  onModeChange: (mode: PeriodMode) => void;
  title: string;
}) {
  const points = recent(datasets[activeMode]);
  const availableModes = modeLabels.filter((mode) => datasets[mode.key].length > 0);

  if (!points.length) {
    return null;
  }

  const valueScale = makeValueScale(points, metrics);
  const zeroY = ((valueScale.max - 0) / valueScale.range) * 100;
  const lineScale = makeLineScale(points);
  const dots = linePoints(points, lineScale);
  const segments = lineSegments(points, lineScale);

  return (
    <section className={css(styles, "financial-mini-chart")}>
      <div className={css(styles, "financial-mini-chart-head")}>
        <h3>
          {title}
          <InfoTooltip>{help}</InfoTooltip>
        </h3>

        <div className={css(styles, "financial-period-toggle")} aria-label={`${title} period`}>
          {availableModes.map((mode) => (
            <button
              aria-pressed={mode.key === activeMode}
              className={css(styles, mode.key === activeMode ? "active" : "")}
              key={mode.key}
              type="button"
              onClick={() => onModeChange(mode.key)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className={css(styles, `financial-combo-plot${lineScale ? " has-line-axis" : ""}`)}>
        {lineScale ? (
          <div className={css(styles, "financial-left-axis")} aria-hidden="true">
            {[lineScale.max, (lineScale.max + lineScale.min) / 2, lineScale.min].map((value) => (
              <span key={value}>{formatPercent(value)}</span>
            ))}
          </div>
        ) : null}

        <div className={css(styles, "financial-right-axis")} aria-hidden="true">
          {axisValues(valueScale).map((value) => (
            <span key={value}>{formatAxisCurrency(value)}</span>
          ))}
        </div>

        <div
          className={css(styles, "financial-combo-stage")}
          style={{ "--financial-point-count": points.length, "--zero-y": `${zeroY}%` } as CSSProperties}
        >
          <div className={css(styles, "financial-combo-grid")} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>

          {segments.length ? (
            <div className={css(styles, "financial-combo-line-segments")} aria-hidden="true">
              {segments.map((segment) => (
                <span
                  className={css(styles, "financial-combo-line-segment")}
                  key={`${segment.from.period}-${segment.to.period}`}
                  style={
                    {
                      "--line-left": `${segment.from.x}%`,
                      "--line-width": `${segment.to.x - segment.from.x}%`
                    } as CSSProperties
                  }
                >
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" x2="100" y1={segment.from.y} y2={segment.to.y} />
                  </svg>
                </span>
              ))}
            </div>
          ) : null}

          {dots.length ? (
            <div className={css(styles, "financial-combo-line-dots")} aria-hidden="true">
              {dots.map((dot) => (
                <span
                  className={css(styles, "financial-combo-line-point")}
                  key={dot.period}
                  style={{ "--line-point-x": `${dot.x}%`, "--line-point-y": `${dot.y}%` } as CSSProperties}
                />
              ))}
            </div>
          ) : null}

          <div className={css(styles, "financial-combo-groups")}>
            {points.map((point) => (
              <button
                aria-label={`${point.period}: ${metrics
                  .map((metric) => `${metric.label} ${formatValueForLabel(point.bars[metric.key])}`)
                  .join(", ")}${lineLabel ? `, ${lineLabel} ${formatPercent(point.line ?? null)}` : ""}`}
                className={css(styles, "financial-combo-group")}
                key={point.period}
                type="button"
              >
                <span className={css(styles, "financial-combo-bar-area")} aria-hidden="true">
                  {metrics.map((metric) => {
                    const value = point.bars[metric.key];

                    return (
                      <span className={css(styles, "financial-combo-bar-slot")} key={metric.key}>
                        <span
                          className={css(
                            styles,
                            "financial-combo-bar",
                            metric.className,
                            value !== null && value < 0 ? "is-negative" : ""
                          )}
                          style={barStyle(value, valueScale)}
                        />
                      </span>
                    );
                  })}
                </span>
                <span className={css(styles, "financial-combo-label")}>{formatPeriodLabel(point.period, activeMode)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={css(styles, "financial-combo-legend")} aria-hidden="true">
        {metrics.map((metric) => (
          <span key={metric.key}>
            <i className={css(styles, metric.className)} />
            {metric.label}
          </span>
        ))}
        {lineLabel ? (
          <span>
            <i className={css(styles, "margin")} />
            {lineLabel}
          </span>
        ) : null}
      </div>
    </section>
  );
}

export function FinancialPerformanceExperimental({
  balanceSheet,
  cashFlows,
  id,
  quarterly,
  ticker,
  yearly
}: {
  balanceSheet: FinancialTable;
  cashFlows: FinancialTable;
  id?: string;
  quarterly: FinancialTable;
  ticker: string;
  yearly: FinancialTable;
}) {
  const [performanceMode, setPerformanceMode] = useState<PeriodMode>(hasTable(yearly) ? "yearly" : "quarterly");
  const [debtMode, setDebtMode] = useState<PeriodMode>("yearly");

  const performanceDatasets = useMemo(
    () => ({
      yearly: getPerformanceSeries(yearly),
      quarterly: getPerformanceSeries(quarterly)
    }),
    [quarterly, yearly]
  );
  const debtDatasets = useMemo(
    () => ({
      yearly: getDebtSeries(balanceSheet, cashFlows),
      quarterly: []
    }),
    [balanceSheet, cashFlows]
  );

  const resolvedPerformanceMode = performanceDatasets[performanceMode].length
    ? performanceMode
    : performanceDatasets.yearly.length
      ? "yearly"
      : "quarterly";
  const resolvedDebtMode = debtDatasets[debtMode].length ? debtMode : debtDatasets.yearly.length ? "yearly" : "quarterly";

  if (!performanceDatasets[resolvedPerformanceMode].length && !debtDatasets[resolvedDebtMode].length) {
    return null;
  }

  return (
    <section className={css(styles, `financial-overview${id ? " section-anchor" : ""}`)} id={id}>
      <div className={css(styles, "section-title-row financial-performance-head")}>
        <h2>Financial Performance</h2>
        <Link className={css(styles, "shareholding-detail-link financial-detail-link")} href={companyFinancialsHref(ticker)}>
          All Financials
          <ChevronRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <FinancialMiniChart
        activeMode={resolvedPerformanceMode}
        datasets={performanceDatasets}
        help="Revenue shows sales, net income shows profit after tax, and net margin is net income divided by revenue."
        lineLabel="Net margin %"
        metrics={performanceMetrics}
        title="Performance"
        onModeChange={setPerformanceMode}
      />

      <FinancialMiniChart
        activeMode={resolvedDebtMode}
        datasets={debtDatasets}
        help="Debt is total borrowings. Free cash flow is cash left after capital spending. Cash and equivalents are liquid balances on the balance sheet."
        metrics={debtMetrics}
        title="Debt level and coverage"
        onModeChange={setDebtMode}
      />
    </section>
  );
}
