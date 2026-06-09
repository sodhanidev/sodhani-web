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

type ChartLineMetric = {
  key: string;
  label: string;
  className: string;
  valueFormatter?: (value: number | null) => string;
};

type ChartPoint = {
  period: string;
  bars: Record<string, number | null>;
  lines: Record<string, number | null>;
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
  { key: "ebitda", label: "EBITDA", className: "ebitda" },
  { key: "pat", label: "PAT", className: "pat" }
];

const performanceLineMetrics: ChartLineMetric[] = [
  { key: "ebitdaMargin", label: "EBITDA margin %", className: "ebitda-margin" },
  { key: "patMargin", label: "PAT margin %", className: "pat-margin" }
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
  const ebitdaRow = findRow(table, ["Operating Profit", "EBITDA"]);
  const ebitdaMarginRow = findRow(table, ["OPM %", "EBITDA Margin %"]);
  const patRow = findRow(table, ["Net Profit", "Profit After Tax", "PAT"]);

  return table.periods
    .map((period) => {
      const revenue = parseNumericCell(revenueRow?.values[period]);
      const ebitda = parseNumericCell(ebitdaRow?.values[period]);
      const pat = parseNumericCell(patRow?.values[period]);
      const explicitEbitdaMargin = parseNumericCell(ebitdaMarginRow?.values[period]);
      const ebitdaMargin =
        explicitEbitdaMargin ?? (revenue !== null && revenue !== 0 && ebitda !== null ? (ebitda / revenue) * 100 : null);
      const patMargin = revenue !== null && revenue !== 0 && pat !== null ? (pat / revenue) * 100 : null;

      return {
        period,
        bars: {
          revenue,
          ebitda,
          pat
        },
        lines: {
          ebitdaMargin,
          patMargin
        }
      };
    })
    .filter((point) => Object.values(point.bars).some((value) => value !== null));
}

function getDebtSeries(balanceSheet: FinancialTable, cashFlows: FinancialTable): ChartPoint[] {
  const debtRow = findRow(balanceSheet, ["Borrowings", "Debt"]);
  const equityCapitalRow = findRow(balanceSheet, ["Equity Capital", "Share Capital"]);
  const reservesRow = findRow(balanceSheet, ["Reserves", "Other Equity"]);
  const cashEquivalentsRow = findRow(balanceSheet, ["Cash Equivalents", "Cash & Equivalents"]);
  const freeCashFlowRow = findRow(cashFlows, ["Free Cash Flow"]);

  return balanceSheet.periods
    .map((period) => {
      const debt = parseNumericCell(debtRow?.values[period]);
      const equityCapital = parseNumericCell(equityCapitalRow?.values[period]);
      const reserves = parseNumericCell(reservesRow?.values[period]);
      const totalEquity =
        equityCapital !== null && reserves !== null ? equityCapital + reserves : null;

      return {
        period,
        bars: {
          debt,
          freeCashFlow: parseNumericCell(freeCashFlowRow?.values[period]),
          cashEquivalents: parseNumericCell(cashEquivalentsRow?.values[period])
        },
        lines: {
          debtEquity: debt !== null && totalEquity !== null && totalEquity > 0 ? debt / totalEquity : null
        }
      };
    })
    .filter((point) => Object.values(point.bars).some((value) => value !== null) || point.lines.debtEquity !== null);
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

function formatRatio(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatIndianNumber(value, { dp: 2 })}x`;
}

function formatLineValue(metric: ChartLineMetric, value: number | null) {
  return (metric.valueFormatter ?? formatPercent)(value);
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

function makeLineScale(points: ChartPoint[], metrics: ChartLineMetric[]): Scale | null {
  const values = points
    .flatMap((point) => metrics.map((metric) => point.lines[metric.key]))
    .filter((value): value is number => value !== null && Number.isFinite(value));

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

function linePoints(points: ChartPoint[], scale: Scale | null, metric: ChartLineMetric) {
  if (!scale) {
    return [];
  }

  return points.flatMap((point, index) => {
    const value = point.lines[metric.key];

    if (value === null || value === undefined || !Number.isFinite(value)) {
      return [];
    }

    return [
      {
        period: point.period,
        x: ((index + 0.5) / points.length) * 100,
        y: ((scale.max - value) / scale.range) * 100
      }
    ];
  });
}

function lineSegments(points: ChartPoint[], scale: Scale | null, metric: ChartLineMetric) {
  const plottedPoints = linePoints(points, scale, metric);

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
  lineMetrics = [],
  metrics,
  onModeChange,
  selectableFields = false,
  title
}: {
  activeMode: PeriodMode;
  datasets: Record<PeriodMode, ChartPoint[]>;
  help: string;
  lineMetrics?: ChartLineMetric[];
  metrics: ChartMetric[];
  onModeChange: (mode: PeriodMode) => void;
  selectableFields?: boolean;
  title: string;
}) {
  const allFieldKeys = useMemo(
    () => [...metrics.map((metric) => metric.key), ...lineMetrics.map((metric) => metric.key)],
    [lineMetrics, metrics]
  );
  const [selectedFieldKeys, setSelectedFieldKeys] = useState(() => new Set(allFieldKeys));
  const points = recent(datasets[activeMode]);
  const availableModes = modeLabels.filter((mode) => datasets[mode.key].length > 0);
  const visibleFieldKeys = selectableFields ? selectedFieldKeys : new Set(allFieldKeys);
  const visibleMetrics = metrics.filter((metric) => visibleFieldKeys.has(metric.key));
  const visibleLineMetrics = lineMetrics.filter((metric) => visibleFieldKeys.has(metric.key));

  if (!points.length) {
    return null;
  }

  const valueScale = makeValueScale(points, visibleMetrics);
  const zeroY = ((valueScale.max - 0) / valueScale.range) * 100;
  const lineScale = makeLineScale(points, visibleLineMetrics);
  const lineSeries = visibleLineMetrics.map((metric) => ({
    dots: linePoints(points, lineScale, metric),
    metric,
    segments: lineSegments(points, lineScale, metric)
  }));
  const lineAxisFormatter =
    visibleLineMetrics.length === 1 ? visibleLineMetrics[0].valueFormatter ?? formatPercent : formatPercent;
  const selectedFieldCount = visibleMetrics.length + visibleLineMetrics.length;

  function toggleField(key: string) {
    setSelectedFieldKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        if (next.size === 1) {
          return current;
        }

        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

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

      <div className={css(styles, "financial-combo-plot", lineScale ? "has-line-axis" : "")}>
        {lineScale ? (
          <div className={css(styles, "financial-left-axis")} aria-hidden="true">
            {[lineScale.max, (lineScale.max + lineScale.min) / 2, lineScale.min].map((value) => (
              <span key={value}>{lineAxisFormatter(value)}</span>
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

          {lineSeries.some((series) => series.segments.length) ? (
            <div className={css(styles, "financial-combo-line-segments")} aria-hidden="true">
              {lineSeries.flatMap((series) =>
                series.segments.map((segment) => (
                  <span
                    className={css(styles, "financial-combo-line-segment", series.metric.className)}
                    key={`${series.metric.key}-${segment.from.period}-${segment.to.period}`}
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
                ))
              )}
            </div>
          ) : null}

          {lineSeries.some((series) => series.dots.length) ? (
            <div className={css(styles, "financial-combo-line-dots")} aria-hidden="true">
              {lineSeries.flatMap((series) =>
                series.dots.map((dot) => (
                  <span
                    className={css(styles, "financial-combo-line-point", series.metric.className)}
                    key={`${series.metric.key}-${dot.period}`}
                    style={{ "--line-point-x": `${dot.x}%`, "--line-point-y": `${dot.y}%` } as CSSProperties}
                  />
                ))
              )}
            </div>
          ) : null}

          <div className={css(styles, "financial-combo-groups")}>
            {points.map((point) => (
              <button
                aria-label={`${point.period}: ${visibleMetrics
                  .map((metric) => `${metric.label} ${formatValueForLabel(point.bars[metric.key])}`)
                  .join(", ")}${visibleLineMetrics.length ? `, ${visibleLineMetrics
                  .map((metric) => `${metric.label} ${formatLineValue(metric, point.lines[metric.key] ?? null)}`)
                  .join(", ")}` : ""}`}
                className={css(styles, "financial-combo-group")}
                key={point.period}
                type="button"
              >
                <span className={css(styles, "financial-combo-bar-area")} aria-hidden="true">
                  {visibleMetrics.map((metric) => {
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

      {selectableFields ? (
        <div className={css(styles, "financial-field-toggles")} aria-label={`${title} visible fields`}>
          {[...metrics, ...lineMetrics].map((metric) => {
            const checked = visibleFieldKeys.has(metric.key);

            return (
              <label className={css(styles, "financial-field-toggle")} key={metric.key}>
                <input
                  checked={checked}
                  disabled={checked && selectedFieldCount === 1}
                  type="checkbox"
                  onChange={() => toggleField(metric.key)}
                />
                <span className={css(styles, "financial-field-swatch", metric.className)} aria-hidden="true" />
                <span>{metric.label}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className={css(styles, "financial-combo-legend")} aria-hidden="true">
          {metrics.map((metric) => (
            <span key={metric.key}>
              <i className={css(styles, metric.className)} />
              {metric.label}
            </span>
          ))}
          {lineMetrics.map((metric) => (
            <span key={metric.key}>
              <i className={css(styles, metric.className)} />
              {metric.label}
            </span>
          ))}
        </div>
      )}
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
  const showDebtCoverageChart = false;
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

  if (!performanceDatasets[resolvedPerformanceMode].length) {
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
        help="Revenue shows sales. EBITDA uses operating profit, PAT uses net profit, and the margin lines are shown as percentages of revenue."
        lineMetrics={performanceLineMetrics}
        metrics={performanceMetrics}
        selectableFields
        title="Performance"
        onModeChange={setPerformanceMode}
      />

      {/* Debt level and coverage graph hidden for now; flip showDebtCoverageChart to restore it. */}
      {showDebtCoverageChart ? (
        <FinancialMiniChart
          activeMode={resolvedDebtMode}
          datasets={debtDatasets}
          help="Debt is total borrowings. Free cash flow is cash left after capital spending. Cash and equivalents are liquid balances on the balance sheet. Debt to equity is borrowings divided by equity capital plus reserves."
          lineMetrics={[{ key: "debtEquity", label: "Debt to Equity", className: "debt-equity", valueFormatter: formatRatio }]}
          metrics={debtMetrics}
          title="Debt level and coverage"
          onModeChange={setDebtMode}
        />
      ) : null}
    </section>
  );
}
