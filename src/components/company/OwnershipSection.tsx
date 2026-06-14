"use client";

import { type ReactNode, useState } from "react";

import { css } from "@/lib/css-module";
import styles from "./company.module.css";

export function OwnershipSection({
  children,
  id,
  kicker,
  meta,
  title
}: {
  children: ReactNode;
  id: string;
  kicker: string;
  meta: string;
  title: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className={css(styles, "ownership-section")} id={id}>
      <button
        aria-expanded={open}
        className={css(styles, "ownership-section-heading ownership-section-toggle")}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <div>
          <span>{kicker}</span>
          <h2>
            <span className={css(styles, `collapse-caret${open ? " is-open" : ""}`)} aria-hidden="true" />
            {title}
          </h2>
        </div>
        <p>{meta}</p>
      </button>
      {open ? children : null}
    </section>
  );
}
