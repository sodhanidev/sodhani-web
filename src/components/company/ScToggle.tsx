"use client";

import { css } from "@/lib/css-module";
import styles from "./company.module.css";

export type ScMode = "standalone" | "consolidated";

// Single blue hyperlink-style toggle. Shows the abbreviation of the OTHER view
// — (C) while standalone, (S) while consolidated — with an instant hover
// tooltip spelling out the action. Clicking flips the mode.
export function ScToggle({
  value,
  onChange,
  ariaLabel = "Toggle standalone or consolidated"
}: {
  value: ScMode;
  onChange: (mode: ScMode) => void;
  ariaLabel?: string;
}) {
  const next: ScMode = value === "standalone" ? "consolidated" : "standalone";
  const short = next === "consolidated" ? "(C)" : "(S)";
  const tip = next === "consolidated" ? "Show Consolidated" : "Show Standalone";

  return (
    <span className={css(styles, "sc-toggle")}>
      <button
        aria-label={`${ariaLabel}: ${tip}`}
        className={css(styles, "sc-toggle-link")}
        type="button"
        onClick={() => onChange(next)}
      >
        {short}
        <span className={css(styles, "sc-toggle-tip")} role="tooltip" aria-hidden="true">
          {tip}
        </span>
      </button>
    </span>
  );
}
