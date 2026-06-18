"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import { MetricCardGrid, type MetricCardItem } from "@/components/company/MetricCardGrid";
import { InfoTooltip } from "./InfoTooltip";
import { ScToggle, type ScMode } from "./ScToggle";
import {
  ANNUAL_RESULT_PERIODS,
  QUARTERLY_RESULT_PERIODS,
  companyHref,
  formatIndianNumber,
  limitTablePeriods,
  parseNumericCell
} from "@/lib/data/format";
import type { FinRow, FinancialTable, Stock } from "@/lib/data/types";

type FinancialTabKey = "income" | "balance" | "cash";
type PeriodMode = "quarterly" | "yearly";

type FinancialTab = {
  key: FinancialTabKey;
  label: string;
  kicker: string;
  yearlyOnly?: boolean;
};

const financialTabs: FinancialTab[] = [
  { key: "income", label: "Income", kicker: "Statement" },
  { key: "balance", label: "Balance Sheet", kicker: "Position", yearlyOnly: true },
  { key: "cash", label: "Cash Flow", kicker: "Cash", yearlyOnly: true }
];

const highlightedRows = new Set([
  "sales",
  "revenue",
  "expenses",
  "net profit",
  "total assets",
  "total liabilities",
  "cash from operating activity",
  "net cash flow",
  "free cash flow",
  "roce %"
]);

function hasTable(table: FinancialTable) {
  return table.periods.length > 0 && table.rows.length > 0;
}

function normalizedLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9%]+/gu, " ").trim();
}

function findRow(table: FinancialTable, labels: string[]) {
  const wanted = new Set(labels.map(normalizedLabel));
  return table.rows.find((row) => wanted.has(normalizedLabel(row.label)));
}

function getLatestValue(table: FinancialTable, labels: string[], options: { prefix?: string; suffix?: string } = {}) {
  const period = table.periods.at(-1);
  const row = findRow(table, labels);
  const value = period ? parseNumericCell(row?.values[period]) : null;

  if (value === null) {
    return "-";
  }

  return `${options.prefix ?? ""}${formatIndianNumber(value, { dp: options.suffix === "%" ? 2 : 0 })}${options.suffix ?? ""}`;
}

function getLatestPeriod(table: FinancialTable) {
  return table.periods.at(-1) ?? "-";
}

function getTableForTab(stock: Stock, tab: FinancialTabKey, mode: PeriodMode) {
  if (tab === "income") {
    return mode === "quarterly" ? stock.quarterly : stock.profitLoss;
  }

  if (tab === "balance") {
    return stock.balanceSheet;
  }

  return stock.cashFlows;
}

function getTableDisplayPeriods(table: FinancialTable) {
  return [...table.periods].reverse();
}

function rowHasValues(row: FinRow, periods: string[]) {
  return periods.some((period) => row.values[period]);
}

function getCellTone(label: string, value: string) {
  const normalized = normalizedLabel(label);
  const numericValue = parseNumericCell(value);
  const directionalRow =
    normalized.includes("%") ||
    normalized.includes("growth") ||
    normalized.includes("margin") ||
    normalized.includes("ebitda") ||
    normalized.includes("profit") ||
    normalized === "pat" ||
    normalized.includes("cash flow") ||
    normalized.includes("opm") ||
    normalized.includes("roce") ||
    normalized.includes("roe") ||
    normalized.includes("cfo");

  if (numericValue === null || numericValue === 0) {
    return "";
  }

  if (numericValue < 0) {
    return "financials-negative";
  }

  return directionalRow ? "financials-positive" : "";
}

function getPeriodLabel(table: FinancialTable, mode?: PeriodMode) {
  if (mode === "quarterly") {
    const years = table.periods.length / 4;
    const yearLabel = Number.isInteger(years) ? `${years} years` : `${formatIndianNumber(years, { dp: 1 })} years`;
    return `${table.periods.length} quarters · ${yearLabel}`;
  }

  if (mode === "yearly") {
    return `${table.periods.length} years`;
  }

  return `${table.periods.length} periods`;
}

function FinancialRow({
  child = false,
  periods,
  row
}: {
  child?: boolean;
  periods: string[];
  row: FinRow;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = row.children.length > 0;

  if (!rowHasValues(row, periods) && !hasChildren) {
    return null;
  }

  const rowKey = `${child ? "child" : "row"}-${row.label}`;
  const isHighlighted = !child && highlightedRows.has(normalizedLabel(row.label));

  return (
    <>
      <tr className={css(styles, `${child ? "is-child" : ""}${isHighlighted ? " is-highlighted" : ""}`)}>
        <td>
          {hasChildren ? (
            <button
              aria-expanded={open}
              className={css(styles, "financials-row-toggle")}
              onClick={() => setOpen((value) => !value)}
              type="button"
            >
              <span className={css(styles, `collapse-caret${open ? " is-open" : ""}`)} aria-hidden="true" />
              {row.label}
            </button>
          ) : (
            <span className={css(styles, "financials-particular")}>{row.label}</span>
          )}
        </td>
        {periods.map((period) => (
          <td className={css(styles, `numeric ${getCellTone(row.label, row.values[period] || "")}`)} key={`${rowKey}-${period}`}>
            {row.values[period] || "-"}
          </td>
        ))}
      </tr>
      {hasChildren && open
        ? row.children.map((childRow) => (
            <FinancialRow child key={`${rowKey}-${childRow.label}`} periods={periods} row={childRow} />
          ))
        : null}
    </>
  );
}

function FinancialRows({ periods, rows }: { periods: string[]; rows: FinRow[] }) {
  return (
    <>
      {rows.map((row) => (
        <FinancialRow key={`row-${row.label}`} periods={periods} row={row} />
      ))}
    </>
  );
}

const SC_TOOLTIP =
  "Standalone covers the parent company alone. Consolidated includes its subsidiaries — the standard view for valuation.";

function hasAnyTable(s: Stock) {
  return hasTable(s.quarterly) || hasTable(s.profitLoss) || hasTable(s.balanceSheet) || hasTable(s.cashFlows);
}

function StatementSection({
  id,
  kicker,
  meta,
  periods,
  rows,
  title,
  scMode,
  onScChange,
  showToggle
}: {
  id: string;
  kicker: string;
  meta: string;
  periods: string[];
  rows: FinRow[];
  title: string;
  scMode: ScMode;
  onScChange: (mode: ScMode) => void;
  showToggle: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className={css(styles, "financials-statement-section")} id={id}>
      <div className={css(styles, "financials-detail-heading financials-statement-head")}>
        <button
          aria-expanded={open}
          className={css(styles, "financials-section-toggle financials-statement-collapse")}
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <div>
            <span>{kicker}</span>
            <h2>
              <span className={css(styles, `collapse-caret${open ? " is-open" : ""}`)} aria-hidden="true" />
              {title}
            </h2>
          </div>
        </button>
        {showToggle ? (
          <div className={css(styles, "sc-toggle-row")}>
            <ScToggle value={scMode} onChange={onScChange} ariaLabel={`${title} standalone or consolidated`} />
            <InfoTooltip>{SC_TOOLTIP}</InfoTooltip>
          </div>
        ) : null}
        <p className={css(styles, "financials-statement-meta")}>{meta}</p>
      </div>
      {open ? (
        <div className={css(styles, "financials-table-card")}>
          <div className={css(styles, "financials-table-wrap")}>
            <table className={css(styles, "financials-table")}>
              <thead>
                <tr>
                  <th>Particulars</th>
                  {periods.map((period) => (
                    <th key={period}>{period}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <FinancialRows periods={periods} rows={rows} />
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function FinancialsDetailsClient({ stock, consolidated }: { stock: Stock; consolidated?: Stock }) {
  const hasConsolidated = Boolean(consolidated && hasAnyTable(consolidated));
  const [scMode, setScMode] = useState<ScMode>("standalone");
  const active = scMode === "consolidated" && consolidated ? consolidated : stock;
  const [incomeMode, setIncomeMode] = useState<PeriodMode>(hasTable(active.quarterly) ? "quarterly" : "yearly");
  const hasIncome = hasTable(active.quarterly) || hasTable(active.profitLoss);
  const incomeModes = [
    hasTable(active.quarterly) ? { key: "quarterly" as const, label: "Quarterly" } : null,
    hasTable(active.profitLoss) ? { key: "yearly" as const, label: "Annual" } : null
  ].filter((item): item is { key: PeriodMode; label: string } => Boolean(item));
  const activeIncomeMode = incomeModes.some((item) => item.key === incomeMode) ? incomeMode : incomeModes[0]?.key ?? "yearly";
  const incomeTable = limitTablePeriods(
    getTableForTab(active, "income", activeIncomeMode),
    activeIncomeMode === "quarterly" ? QUARTERLY_RESULT_PERIODS : ANNUAL_RESULT_PERIODS
  );
  const balanceSheet = limitTablePeriods(active.balanceSheet, ANNUAL_RESULT_PERIODS);
  const cashFlows = limitTablePeriods(active.cashFlows, ANNUAL_RESULT_PERIODS);
  const statementSections = [
    hasIncome
      ? {
          id: "income-statement",
          mode: activeIncomeMode,
          table: incomeTable,
          tab: financialTabs[0],
          title: activeIncomeMode === "quarterly" ? "Quarterly Results" : "Annual Results"
        }
      : null,
    hasTable(active.balanceSheet)
      ? {
          id: "balance-sheet",
          mode: "yearly" as const,
          table: balanceSheet,
          tab: financialTabs[1],
          title: "Balance Sheet"
        }
      : null,
    hasTable(active.cashFlows)
      ? {
          id: "cash-flow",
          mode: "yearly" as const,
          table: cashFlows,
          tab: financialTabs[2],
          title: "Cash Flow"
        }
      : null
  ].filter(
    (
      item
    ): item is {
      id: string;
      mode: PeriodMode;
      table: FinancialTable;
      tab: FinancialTab;
      title: string;
    } => Boolean(item)
  );
  const toSummaryMetric = (label: string, labels: string[], options: { prefix?: string; suffix?: string } = {}): MetricCardItem => {
    const value = getLatestValue(incomeTable, labels, options);

    if (value === "-") {
      return {
        badge: { label: "N/A", tone: "unavailable" },
        label,
        value: "Unavailable"
      };
    }

    return {
      detail: getLatestPeriod(incomeTable),
      label,
      value,
      valueTone: getCellTone(label, value)
    };
  };
  const summaryItems: MetricCardItem[] = [
    toSummaryMetric("Revenue Sale", ["Revenue Sale", "Sales", "Revenue"]),
    toSummaryMetric("Other Income", ["Other Income"]),
    toSummaryMetric("Profit Before Tax", ["Profit before tax", "Profit Before Tax"]),
    toSummaryMetric("PAT", ["PAT", "Net Profit", "Profit After Tax"]),
    toSummaryMetric("Operating Profit", ["Operating Profit"]),
    toSummaryMetric("EBITDA", ["EBITDA", "Operating Profit"]),
    toSummaryMetric("EBITDA Margin", ["EBITDA Margin", "OPM %", "Operating Profit Margin"], { suffix: "%" })
  ];

  return (
    <main className={css(styles, "page-stack financials-detail-page")}>
      <header className={css(styles, "financials-detail-hero")}>
        <div>
          <Link className={css(styles, "ownership-back-link")} href={companyHref(stock.ticker)}>
            <ArrowLeft size={15} aria-hidden="true" />
            Back to company
          </Link>
          <p className={css(styles, "ownership-eyebrow")}>{stock.ticker}</p>
          <h1>Financials</h1>
          <p className={css(styles, "financials-company-name")}>{stock.overview.companyName}</p>
        </div>
        <p className={css(styles, "financials-unit-note")}>Values in ₹ Cr unless stated</p>
      </header>

      <section className={css(styles, "metric-summary-band")} aria-label="Latest financial snapshot">
        <MetricCardGrid className="metric-grid-wide" items={summaryItems} />
      </section>

      <div className={css(styles, "financials-control-row")}>
        <nav className={css(styles, "financials-jump-nav")} aria-label="Financial statement sections">
          {statementSections.map((item) => (
            <a href={`#${item.id}`} key={item.id}>
              <span>{item.tab.label}</span>
            </a>
          ))}
        </nav>
        {incomeModes.length > 1 ? (
          <div className={css(styles, "financials-period-toggle")} aria-label="Income statement period">
            {incomeModes.map((item) => (
              <button
                className={css(styles, item.key === activeIncomeMode ? "active" : "")}
                key={item.key}
                type="button"
                onClick={() => setIncomeMode(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <section className={css(styles, "financials-detail-panel")}>
        {statementSections.map((item) => (
          <StatementSection
            id={item.id}
            key={item.id}
            kicker={item.tab.kicker}
            meta={`${getPeriodLabel(item.table, item.mode)} · latest ${getLatestPeriod(item.table)}`}
            periods={getTableDisplayPeriods(item.table)}
            rows={item.table.rows}
            title={item.title}
            scMode={scMode}
            onScChange={setScMode}
            showToggle={hasConsolidated}
          />
        ))}
      </section>
    </main>
  );
}
