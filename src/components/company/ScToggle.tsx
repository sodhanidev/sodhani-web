"use client";

import { css } from "@/lib/css-module";
import styles from "./company.module.css";

export type ScMode = "standalone" | "consolidated";

// Segmented Standalone/Consolidated control. Active one highlighted.
// Sits just right of the section title.
export function ScToggle({
  value,
  onChange,
  ariaLabel = "Toggle standalone or consolidated"
}: {
  value: ScMode;
  onChange: (mode: ScMode) => void;
  ariaLabel?: string;
}) {
  return (
    <div className={css(styles, "sc-toggle")} role="group" aria-label={ariaLabel}>
      <button
        aria-label="Standalone"
        aria-pressed={value === "standalone"}
        className={css(styles, `sc-toggle-btn${value === "standalone" ? " is-active" : ""}`)}
        type="button"
        onClick={() => onChange("standalone")}
      >
        S
      </button>
      <button
        aria-label="Consolidated"
        aria-pressed={value === "consolidated"}
        className={css(styles, `sc-toggle-btn${value === "consolidated" ? " is-active" : ""}`)}
        type="button"
        onClick={() => onChange("consolidated")}
      >
        C
      </button>
    </div>
  );
}
