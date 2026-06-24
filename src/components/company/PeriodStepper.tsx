"use client";

import { useState } from "react";
import { ArrowDownNarrowWide } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "./company.module.css";

// Toggle the chronological order of the date columns (newest-first ⇄ oldest-first).
export function usePeriodOrder() {
  const [reversed, setReversed] = useState(false);

  return {
    reversed,
    order: <T,>(periods: T[]) => (reversed ? [...periods].reverse() : periods),
    toggle: () => setReversed((value) => !value)
  };
}

export function PeriodStepper({
  reversed,
  onToggle
}: {
  reversed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      aria-label={reversed ? "Show newest dates first" : "Show oldest dates first"}
      aria-pressed={reversed}
      className={css(styles, `period-stepper${reversed ? " is-open" : ""}`)}
      onClick={onToggle}
      type="button"
    >
      <ArrowDownNarrowWide size={16} aria-hidden="true" />
    </button>
  );
}
