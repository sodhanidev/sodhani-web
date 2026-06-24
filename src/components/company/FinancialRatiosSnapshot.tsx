"use client";

import { useState } from "react";

import { css } from "@/lib/css-module";
import type { FinancialTable } from "@/lib/data/types";
import styles from "./company.module.css";
import { ScToggle, type ScMode } from "./ScToggle";
import { PeriodStepper, usePeriodOrder } from "./PeriodStepper";

const RATIO_PERIODS = 7;

function rowHasValues(row: FinancialTable["rows"][number], periods: string[]) {
  return periods.some((period) => row.values[period]);
}

function hasTable(table: FinancialTable) {
  return table.periods.length > 0 && table.rows.length > 0;
}

export function FinancialRatiosSnapshot({
  annualRatios,
  consolidatedRatios
}: {
  annualRatios: FinancialTable;
  consolidatedRatios?: FinancialTable;
}) {
  const hasConsolidated = Boolean(consolidatedRatios && hasTable(consolidatedRatios));
  const [mode, setMode] = useState<ScMode>("standalone");
  const [open, setOpen] = useState(true);

  const active = mode === "consolidated" && consolidatedRatios ? consolidatedRatios : annualRatios;
  const periodOrder = usePeriodOrder();

  if (!hasTable(active)) {
    return null;
  }

  const displayPeriods = periodOrder.order(active.periods.slice(-RATIO_PERIODS).reverse());
  const rows = active.rows.filter((row) => rowHasValues(row, displayPeriods));

  if (!displayPeriods.length || !rows.length) {
    return null;
  }

  return (
    <section className={css(styles, "ratios-snapshot")} aria-labelledby="financial-ratios-heading">
      <div className={css(styles, "ratios-snapshot-head sc-title-row")}>
        <button
          aria-expanded={open}
          className={css(styles, "financials-detail-heading financials-section-toggle")}
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <div>
            <h2 id="financial-ratios-heading">
              <span className={css(styles, `collapse-caret${open ? " is-open" : ""}`)} aria-hidden="true" />
              Ratios
            </h2>
          </div>
        </button>
        {hasConsolidated ? (
          <ScToggle value={mode} onChange={setMode} ariaLabel="Ratios standalone or consolidated" />
        ) : null}
        {open ? <PeriodStepper reversed={periodOrder.reversed} onToggle={periodOrder.toggle} /> : null}
      </div>
      {open ? (
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
                        {row.values[period] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
