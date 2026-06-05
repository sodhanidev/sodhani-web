"use client";

import { useState } from "react";
import { css } from "@/lib/css-module";
import type { FinancialTable } from "@/lib/data/types";
import styles from "./company.module.css";

type SnapshotMode = "quarterly" | "annual";

const RATIO_PERIODS = 7;
const QUARTERLY_PERIODS = 8;

const snapshotModes: { key: SnapshotMode; label: string }[] = [
  { key: "quarterly", label: "Quarterly" },
  { key: "annual", label: "Annual" }
];

function rowHasValues(row: FinancialTable["rows"][number], periods: string[]) {
  return periods.some((period) => row.values[period]);
}

function hasTable(table: FinancialTable) {
  return table.periods.length > 0 && table.rows.length > 0;
}

function getRatioCellValue(row: FinancialTable["rows"][number], period: string, mode: SnapshotMode) {
  if (mode === "quarterly") {
    return "-";
  }

  return row.values[period] || "-";
}

export function FinancialRatiosSnapshot({
  annualRatios,
  quarterly
}: {
  annualRatios: FinancialTable;
  quarterly: FinancialTable;
}) {
  const [mode, setMode] = useState<SnapshotMode>("annual");
  const hasAnnualRatios = hasTable(annualRatios);
  const availableModes = snapshotModes.filter((item) => {
    return item.key === "quarterly" ? hasAnnualRatios && hasTable(quarterly) : hasAnnualRatios;
  });
  const activeMode = availableModes.some((item) => item.key === mode) ? mode : availableModes[0]?.key ?? "annual";
  const displayPeriods =
    activeMode === "quarterly"
      ? quarterly.periods.slice(-QUARTERLY_PERIODS).reverse()
      : annualRatios.periods.slice(-RATIO_PERIODS).reverse();
  const rows = annualRatios.rows.filter((row) => activeMode === "quarterly" || rowHasValues(row, displayPeriods));

  if (!availableModes.length || !displayPeriods.length || !rows.length) {
    return null;
  }

  return (
    <section className={css(styles, "ratios-snapshot")} aria-labelledby="financial-ratios-heading">
      <div className={css(styles, "financials-detail-heading ratios-snapshot-head")}>
        <div>
          <h2 id="financial-ratios-heading">Ratios</h2>
        </div>
        <div className={css(styles, "ratios-snapshot-actions")}>
          {availableModes.length > 1 ? (
            <div className={css(styles, "financials-period-toggle ratios-snapshot-toggle")} aria-label="Statement period">
              {availableModes.map((item) => (
                <button
                  aria-pressed={item.key === activeMode}
                  className={css(styles, item.key === activeMode ? "active" : "")}
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className={css(styles, "financials-table-card")}>
        <div className={css(styles, "financials-table-wrap ratios-snapshot-wrap")}>
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
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>
                    <span className={css(styles, "financials-particular")}>{row.label}</span>
                  </td>
                  {displayPeriods.map((period) => (
                    <td className={css(styles, "numeric")} key={`${row.label}-${period}`}>
                      {getRatioCellValue(row, period, activeMode)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
