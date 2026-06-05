import { css } from "@/lib/css-module";
import type { FinancialTable } from "@/lib/data/types";
import styles from "./company.module.css";

const RATIO_PERIODS = 7;

function rowHasValues(row: FinancialTable["rows"][number], periods: string[]) {
  return periods.some((period) => row.values[period]);
}

export function FinancialRatiosSnapshot({ table }: { table: FinancialTable }) {
  const periods = table.periods.slice(-RATIO_PERIODS).reverse();
  const rows = table.rows.filter((row) => rowHasValues(row, periods));

  if (!periods.length || !rows.length) {
    return null;
  }

  return (
    <section className={css(styles, "ratios-snapshot")} aria-labelledby="financial-ratios-heading">
      <div className={css(styles, "section-title-row ratios-snapshot-head")}>
        <div>
          <h2 id="financial-ratios-heading">Ratios</h2>
          <p>{periods.length} years</p>
        </div>
      </div>
      <div className={css(styles, "financials-table-wrap ratios-snapshot-wrap")}>
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
            {rows.map((row) => (
              <tr key={row.label}>
                <td>
                  <span className={css(styles, "financials-particular")}>{row.label}</span>
                </td>
                {periods.map((period) => (
                  <td className={css(styles, "numeric")} key={`${row.label}-${period}`}>
                    {row.values[period] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
