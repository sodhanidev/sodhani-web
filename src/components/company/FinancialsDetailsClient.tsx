"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import { companyHref, formatIndianNumber, parseNumericCell } from "@/lib/data/format";
import type { FinRow, FinancialTable, Stock } from "@/lib/data/types";

type FinancialTabKey = "income" | "balance" | "cash" | "ratios";
type PeriodMode = "quarterly" | "yearly";

type FinancialTab = {
  key: FinancialTabKey;
  label: string;
  kicker: string;
  yearlyOnly?: boolean;
};

const financialTabs: FinancialTab[] = [
  { key: "income", label: "Income Statement", kicker: "Quarters and Profit & Loss" },
  { key: "balance", label: "Balance Sheet", kicker: "Assets and liabilities", yearlyOnly: true },
  { key: "cash", label: "Cash Flow", kicker: "Operating, investing, financing", yearlyOnly: true },
  { key: "ratios", label: "Ratios", kicker: "Efficiency and return metrics", yearlyOnly: true }
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

  if (tab === "cash") {
    return stock.cashFlows;
  }

  return stock.ratios;
}

function rowHasValues(row: FinRow, periods: string[]) {
  return periods.some((period) => row.values[period]);
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
          <td className={css(styles, "numeric")} key={`${rowKey}-${period}`}>
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
  const [tab, setTab] = useState<FinancialTabKey>("income");
  const [mode, setMode] = useState<PeriodMode>(hasTable(stock.quarterly) ? "quarterly" : "yearly");
  const hasIncome = hasTable(stock.quarterly) || hasTable(stock.profitLoss);
  const availableTabs = financialTabs.filter((item) =>
    item.key === "income" ? hasIncome : hasTable(getTableForTab(stock, item.key, "yearly"))
  );
  const activeTab = availableTabs.find((item) => item.key === tab) ?? availableTabs[0] ?? financialTabs[0];
  const availableModes = activeTab.yearlyOnly
    ? [{ key: "yearly" as const, label: "Yearly" }]
    : [
        hasTable(stock.quarterly) ? { key: "quarterly" as const, label: "Quarterly" } : null,
        hasTable(stock.profitLoss) ? { key: "yearly" as const, label: "Yearly" } : null
      ].filter((item): item is { key: PeriodMode; label: string } => Boolean(item));
  const activeMode = availableModes.some((item) => item.key === mode) ? mode : availableModes[0]?.key ?? "yearly";
  const activeTable = getTableForTab(stock, activeTab.key, activeMode);

  return (
    <main className={css(styles, "page-stack financials-detail-page")}>
      <header className={css(styles, "financials-detail-hero")}>
        <div>
          <Link className={css(styles, "ownership-back-link")} href={companyHref(stock.ticker)}>
            <ArrowLeft size={15} aria-hidden="true" />
            Back to company
          </Link>
          <p className={css(styles, "ownership-eyebrow")}>{stock.ticker}</p>
          <h1>{stock.overview.companyName}</h1>
          <p>Full financial statements from the static company filing data, with quarterly income and yearly statements.</p>
        </div>
        <div className={css(styles, "financials-summary-grid")}>
          <div>
            <span>Revenue</span>
            <strong className={css(styles, "numeric")}>{getLatestValue(stock.profitLoss, ["Sales", "Revenue"], { prefix: "₹" })}</strong>
            <small>{getLatestPeriod(stock.profitLoss)}</small>
          </div>
          <div>
            <span>Net Profit</span>
            <strong className={css(styles, "numeric")}>{getLatestValue(stock.profitLoss, ["Net Profit"], { prefix: "₹" })}</strong>
            <small>{getLatestPeriod(stock.profitLoss)}</small>
          </div>
          <div>
            <span>Total Assets</span>
            <strong className={css(styles, "numeric")}>{getLatestValue(stock.balanceSheet, ["Total Assets"], { prefix: "₹" })}</strong>
            <small>{getLatestPeriod(stock.balanceSheet)}</small>
          </div>
          <div>
            <span>ROCE</span>
            <strong className={css(styles, "numeric")}>{getLatestValue(stock.ratios, ["ROCE %"], { suffix: "%" })}</strong>
            <small>{getLatestPeriod(stock.ratios)}</small>
          </div>
        </div>
      </header>

      <section className={css(styles, "financials-detail-panel")}>
        <div className={css(styles, "financials-tabs-row")}>
          <nav className={css(styles, "financials-tabs")} aria-label="Financial statement sections">
            {availableTabs.map((item) => (
              <button
                className={css(styles, item.key === activeTab.key ? "active" : "")}
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className={css(styles, "financials-period-toggle")} aria-label="Statement period">
            {availableModes.map((item) => (
              <button
                className={css(styles, item.key === activeMode ? "active" : "")}
                key={item.key}
                type="button"
                onClick={() => setMode(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={css(styles, "financials-detail-heading")}>
          <div>
            <span>{activeTab.kicker}</span>
            <h2>{activeTab.label}</h2>
          </div>
          <p>{activeTable.periods.length} periods</p>
        </div>

        <div className={css(styles, "financials-table-card")}>
          <div className={css(styles, "financials-table-wrap")}>
            <table className={css(styles, "financials-table")}>
              <thead>
                <tr>
                  <th>Particulars</th>
                  {activeTable.periods.map((period) => (
                    <th key={period}>{period}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <FinancialRows periods={activeTable.periods} rows={activeTable.rows} />
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
