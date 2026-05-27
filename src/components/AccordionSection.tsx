"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { FinancialTable } from "./FinancialTable";
import type { FinancialTable as FinancialTableType } from "@/lib/data/types";

export function AccordionSection({
  title,
  table,
  id,
  defaultOpen = false
}: {
  title: string;
  table: FinancialTableType;
  id?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!id) {
      return;
    }

    const openWhenSelected = () => {
      if (window.location.hash === `#${id}`) {
        setOpen(true);
      }
    };

    openWhenSelected();
    window.addEventListener("hashchange", openWhenSelected);

    return () => window.removeEventListener("hashchange", openWhenSelected);
  }, [id]);

  return (
    <section className={`panel${id ? " section-anchor" : ""}`} id={id}>
      <button className="accordion-button section-title-row" type="button" onClick={() => setOpen(!open)}>
        <h2>{title}</h2>
        {open ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
      </button>
      {open ? <FinancialTable table={table} /> : null}
    </section>
  );
}
