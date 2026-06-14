"use client";

import { useState } from "react";

import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import type { FinRow } from "@/lib/data/types";

function ShareholdingRow({
  child = false,
  periods,
  row,
  highlight = false
}: {
  child?: boolean;
  periods: string[];
  row: FinRow;
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = row.children.length > 0;
  const rowKey = `${row.label}-${child ? "child" : "row"}`;

  return (
    <>
      <tr className={css(styles, `${child ? "is-child" : ""}${highlight ? " is-highlighted" : ""}`)}>
        <td>
          {hasChildren ? (
            <button
              aria-expanded={open}
              className={css(styles, "ownership-row-toggle")}
              onClick={() => setOpen((value) => !value)}
              type="button"
            >
              <span className={css(styles, `collapse-caret${open ? " is-open" : ""}`)} aria-hidden="true" />
              {row.label}
            </button>
          ) : (
            <span className={css(styles, "ownership-particular")}>{row.label}</span>
          )}
        </td>
        {periods.map((period) => (
          <td className={css(styles, "numeric")} key={`${rowKey}-${period}`}>
            {row.values[period] || "-"}
          </td>
        ))}
      </tr>
      {hasChildren && open
        ? row.children.map((childRow) => (
            <ShareholdingRow child key={`${rowKey}-${childRow.label}`} periods={periods} row={childRow} />
          ))
        : null}
    </>
  );
}

export function ShareholdingRows({ periods, rows }: { periods: string[]; rows: FinRow[] }) {
  return (
    <>
      {rows.map((row, index) => (
        <ShareholdingRow highlight={index === 0} key={`row-${row.label}`} periods={periods} row={row} />
      ))}
    </>
  );
}
