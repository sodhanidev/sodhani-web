"use client";

import { type ReactNode, useState } from "react";

import { css } from "@/lib/css-module";
import styles from "./company.module.css";

export function OwnershipSection({
  children,
  headerExtra,
  id,
  kicker,
  meta,
  open,
  onToggle,
  title
}: {
  children: ReactNode;
  headerExtra?: ReactNode;
  id: string;
  kicker: string;
  meta: string;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  title: string;
}) {
  const [internalOpen, setInternalOpen] = useState(true);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const toggle = () => {
    const next = !isOpen;
    if (isControlled) {
      onToggle?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  return (
    <section className={css(styles, "ownership-section")} id={id}>
      <div className={css(styles, "ownership-section-heading")}>
        <button
          aria-expanded={isOpen}
          className={css(styles, "ownership-section-toggle ownership-section-collapse")}
          onClick={toggle}
          type="button"
        >
          <div>
            <span>{kicker}</span>
            <h2>
              <span className={css(styles, `collapse-caret${isOpen ? " is-open" : ""}`)} aria-hidden="true" />
              {title}
            </h2>
          </div>
        </button>
        <p>{meta}</p>
        {headerExtra}
      </div>
      {isOpen ? children : null}
    </section>
  );
}
