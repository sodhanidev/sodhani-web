"use client";

import { useCallback, useRef } from "react";
import { css } from "@/lib/css-module";
import styles from "./company.module.css";

// Small "?" affordance with a hover/focus tooltip. Keeps itself inside the
// viewport by nudging horizontally via --tip-shift on open.
export function InfoTooltip({ children }: { children: string }) {
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const clampToViewport = useCallback(() => {
    const tooltip = tooltipRef.current;

    if (!tooltip) {
      return;
    }

    const margin = 8;
    tooltip.style.setProperty("--tip-shift", "0px");

    const rect = tooltip.getBoundingClientRect();
    let shift = 0;

    if (rect.right > window.innerWidth - margin) {
      shift = window.innerWidth - margin - rect.right;
    } else if (rect.left < margin) {
      shift = margin - rect.left;
    }

    if (shift !== 0) {
      tooltip.style.setProperty("--tip-shift", `${Math.round(shift)}px`);
    }
  }, []);

  return (
    <span className={css(styles, "financial-help")} onMouseEnter={clampToViewport} onFocus={clampToViewport}>
      <button aria-label={children} type="button">
        ?
      </button>
      <span className={css(styles, "financial-help-tooltip")} ref={tooltipRef} role="tooltip">
        {children}
      </span>
    </span>
  );
}
