"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import { companyHref, formatIndianNumber, parseNumericCell } from "@/lib/data/format";
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

const QUARTERLY_RESULT_PERIODS = 8;
const ANNUAL_RESULT_PERIODS = 7;

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

function limitTablePeriods(table: FinancialTable, maxPeriods: number): FinancialTable {
  return {
    ...table,
    periods: table.periods.slice(-maxPeriods)
  };
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

function FinancialRows({
  child = false,
  periods,
  rows
}: {
  child?: boolean;
  periods: string[];
  rows: FinRow[];
}) {
  return rows.flatMap((row) => {
    if (!rowHasValues(row, periods) && !row.children.length) {
      return [];
    }

    const rowKey = `${child ? "child" : "row"}-${row.label}`;
    const isHighlighted = !child && highlightedRows.has(normalizedLabel(row.label));

    return [
      <tr className={css(styles, `${child ? "is-child" : ""}${isHighlighted ? " is-highlighted" : ""}`)} key={rowKey}>
        <td>
          <span className={css(styles, "financials-particular")}>
            {row.children.length ? <span className={css(styles, "financials-row-mark")}>+</span> : null}
            {row.label}
          </span>
        </td>
        {periods.map((period) => (
          <td className={css(styles, `numeric ${getCellTone(row.label, row.values[period] || "")}`)} key={`${rowKey}-${period}`}>
            {row.values[period] || "-"}
          </td>
        ))}
      </tr>,
      row.children.length ? (
        <FinancialRows child key={`${rowKey}-children`} periods={periods} rows={row.children} />
      ) : null
    ];
  });
}

export function FinancialsDetailsClient({ stock }: { stock: Stock }) {
  const [incomeMode, setIncomeMode] = useState<PeriodMode>(hasTable(stock.quarterly) ? "quarterly" : "yearly");
  const hasIncome = hasTable(stock.quarterly) || hasTable(stock.profitLoss);
  const incomeModes = [
    hasTable(stock.quarterly) ? { key: "quarterly" as const, label: "Quarterly" } : null,
    hasTable(stock.profitLoss) ? { key: "yearly" as const, label: "Annual" } : null
  ].filter((item): item is { key: PeriodMode; label: string } => Boolean(item));
  const activeIncomeMode = incomeModes.some((item) => item.key === incomeMode) ? incomeMode : incomeModes[0]?.key ?? "yearly";
  const incomeTable = limitTablePeriods(
    getTableForTab(stock, "income", activeIncomeMode),
    activeIncomeMode === "quarterly" ? QUARTERLY_RESULT_PERIODS : ANNUAL_RESULT_PERIODS
  );
  const balanceSheet = limitTablePeriods(stock.balanceSheet, ANNUAL_RESULT_PERIODS);
  const cashFlows = limitTablePeriods(stock.cashFlows, ANNUAL_RESULT_PERIODS);
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
    hasTable(stock.balanceSheet)
      ? {
          id: "balance-sheet",
          mode: "yearly" as const,
          table: balanceSheet,
          tab: financialTabs[1],
          title: "Balance Sheet"
        }
      : null,
    hasTable(stock.cashFlows)
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
  const summaryItems = [
    {
      label: "Revenue Sale",
      period: getLatestPeriod(incomeTable),
      value: getLatestValue(incomeTable, ["Revenue Sale", "Sales", "Revenue"])
    },
    {
      label: "Other Income",
      period: getLatestPeriod(incomeTable),
      value: getLatestValue(incomeTable, ["Other Income"])
    },
    {
      label: "Profit Before Tax",
      period: getLatestPeriod(incomeTable),
      value: getLatestValue(incomeTable, ["Profit before tax", "Profit Before Tax"])
    },
    {
      label: "PAT",
      period: getLatestPeriod(incomeTable),
      value: getLatestValue(incomeTable, ["PAT", "Net Profit", "Profit After Tax"])
    },
    {
      label: "Operating Profit",
      period: getLatestPeriod(incomeTable),
      value: getLatestValue(incomeTable, ["Operating Profit"])
    },
    {
      label: "EBITDA",
      period: getLatestPeriod(incomeTable),
      value: getLatestValue(incomeTable, ["EBITDA", "Operating Profit"])
    },
    {
      label: "EBITDA Margin",
      period: getLatestPeriod(incomeTable),
      value: getLatestValue(incomeTable, ["EBITDA Margin", "OPM %", "Operating Profit Margin"], { suffix: "%" })
    }
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

      <section className={css(styles, "financials-summary-grid")} aria-label="Latest financial snapshot">
        {summaryItems.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong className={css(styles, `numeric ${getCellTone(item.label, item.value)}`)}>{item.value}</strong>
            <small>{item.period}</small>
          </div>
        ))}
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
        {statementSections.map((item) => {
          const displayPeriods = getTableDisplayPeriods(item.table);

          return (
            <section className={css(styles, "financials-statement-section")} id={item.id} key={item.id}>
              <div className={css(styles, "financials-detail-heading")}>
                <div>
                  <span>{item.tab.kicker}</span>
                  <h2>{item.title}</h2>
                </div>
                <p>
                  {getPeriodLabel(item.table, item.mode)} · latest {getLatestPeriod(item.table)}
                </p>
              </div>
              <div className={css(styles, "financials-table-card")}>
                <div className={css(styles, "financials-table-wrap")}>
                  <table className={css(styles, "financials-table")}>
                    <thead>
                      <tr>
                        <th>Particulars</th>
                        {displayPeriods.map((period) => (
                          <th key={period}>{period}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <FinancialRows periods={displayPeriods} rows={item.table.rows} />
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}
