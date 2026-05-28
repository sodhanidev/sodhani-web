"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { FinRow, FinancialTable as FinancialTableType } from "@/lib/data/types";

function FinTableRow({
  row,
  periods,
  child = false
}: {
  row: FinRow;
  periods: string[];
  child?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className={child ? "child-row" : ""}>
        <td>
          {row.expandable ? (
            <button className="sort-button" type="button" onClick={() => setOpen(!open)}>
              {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
              {row.label}
            </button>
          ) : (
            row.label
          )}
        </td>
        {periods.map((period) => (
          <td className="numeric" key={`${row.label}-${period}`}>
            {row.values[period] ?? ""}
          </td>
        ))}
      </tr>
      {open
        ? row.children.map((childRow) => (
            <FinTableRow child key={`${row.label}-${childRow.label}`} periods={periods} row={childRow} />
          ))
        : null}
    </>
  );
}

export function FinancialTable({ table }: { table: FinancialTableType }) {
  if (!table.rows.length) {
    return null;
  }

  return (
    <div className="table-wrap">
      <table className="fin-table">
        <thead>
          <tr>
            <th>Metric</th>
            {table.periods.map((period) => (
              <th key={period}>{period}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <FinTableRow key={row.label} periods={table.periods} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
