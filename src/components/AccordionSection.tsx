"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { FinancialTable } from "./FinancialTable";
import type { FinancialTable as FinancialTableType } from "@/lib/data/types";

export function AccordionSection({
  title,
  table,
  defaultOpen = false
}: {
  title: string;
  table: FinancialTableType;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="panel">
      <button className="accordion-button section-title-row" type="button" onClick={() => setOpen(!open)}>
        <h2>{title}</h2>
        {open ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
      </button>
      {open ? <FinancialTable table={table} /> : null}
    </section>
  );
}
