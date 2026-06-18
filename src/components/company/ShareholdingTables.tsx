"use client";

import { useState } from "react";

import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import { OwnershipSection } from "./OwnershipSection";
import { ShareholdingRows } from "./ShareholdingRows";
import { PeriodStepper, usePeriodOrder } from "./PeriodStepper";
import type { FinancialTable, Stock } from "@/lib/data/types";

type InvestorGroups = Stock["investors"]["quarterly"];

const categoryLabels: Record<string, string> = {
  promoters: "Promoters",
  foreign_institutions: "Foreign Institutions",
  domestic_institutions: "Domestic Institutions",
  government: "Government",
  public: "Public"
};

function hasTable(table: FinancialTable) {
  return table.periods.length > 0 && table.rows.length > 0;
}

function getCategoryLabel(category: string) {
  return categoryLabels[category] ?? category.replace(/_/gu, " ");
}

function getLatestPeriod(table: FinancialTable) {
  return table.periods.at(-1) ?? "-";
}

function getInvestorPeriods(groups: InvestorGroups, preferredPeriods: string[]) {
  const seen = new Set<string>();

  Object.values(groups).forEach((holders) => {
    Object.values(holders).forEach((values) => {
      Object.keys(values).forEach((period) => seen.add(period));
    });
  });

  const ordered = preferredPeriods.filter((period) => seen.has(period));
  const extras = Array.from(seen).filter((period) => !ordered.includes(period));
  return [...ordered, ...extras];
}

function formatInvestorValue(value: string | undefined) {
  if (!value) {
    return "-";
  }

  if (value.includes("%")) {
    return value;
  }

  return /^-?[\d,.]+$/u.test(value) ? `${value}%` : value;
}

export function ShareholdingTable({
  id,
  kicker,
  table,
  title
}: {
  id: string;
  kicker: string;
  table: FinancialTable;
  title: string;
}) {
  const [open, setOpen] = useState(true);
  const periodOrder = usePeriodOrder();

  if (!hasTable(table)) {
    return null;
  }

  const periods = periodOrder.order(table.periods);

  return (
    <OwnershipSection
      id={id}
      kicker={kicker}
      meta={`${periods.length} periods · latest ${getLatestPeriod(table)}`}
      open={open}
      onToggle={setOpen}
      headerExtra={open ? <PeriodStepper reversed={periodOrder.reversed} onToggle={periodOrder.toggle} /> : null}
      title={title}
    >
      <div className={css(styles, "ownership-table-card")}>
        <div className={css(styles, "ownership-table-wrap")}>
          <table className={css(styles, "ownership-table")}>
            <thead>
              <tr>
                <th>Particulars</th>
                {periods.map((period) => (
                  <th key={period}>{period}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ShareholdingRows periods={periods} rows={table.rows} />
            </tbody>
          </table>
        </div>
      </div>
    </OwnershipSection>
  );
}

function InvestorCategoryCard({
  category,
  holders,
  periods
}: {
  category: string;
  holders: Record<string, Record<string, string>>;
  periods: string[];
}) {
  const holderRows = Object.entries(holders);

  if (!holderRows.length) {
    return null;
  }

  return (
    <article className={css(styles, "ownership-investor-card")}>
      <div className={css(styles, "ownership-investor-card-head")}>
        <h3>{getCategoryLabel(category)}</h3>
        <span>{holderRows.length} holders</span>
      </div>
      <div className={css(styles, "ownership-table-card")}>
        <div className={css(styles, "ownership-table-wrap")}>
          <table className={css(styles, "ownership-table ownership-investor-table")}>
            <thead>
              <tr>
                <th>Holder</th>
                {periods.map((period) => (
                  <th key={period}>{period}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holderRows.map(([holder, values], index) => (
                <tr className={css(styles, index === 0 ? "is-highlighted" : "")} key={holder}>
                  <td>{holder}</td>
                  {periods.map((period) => (
                    <td className={css(styles, "numeric")} key={`${holder}-${period}`}>
                      {formatInvestorValue(values[period])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}

export function InvestorDetailsSection({
  groups,
  id,
  preferredPeriods,
  title
}: {
  groups: InvestorGroups;
  id: string;
  preferredPeriods: string[];
  title: string;
}) {
  const categories = Object.entries(groups).filter(([, holders]) => Object.keys(holders).length > 0);
  const allPeriods = getInvestorPeriods(groups, preferredPeriods);
  const [open, setOpen] = useState(true);
  const periodOrder = usePeriodOrder();

  if (!categories.length) {
    return null;
  }

  const periods = periodOrder.order(allPeriods);

  return (
    <OwnershipSection
      id={id}
      kicker="Investor Holding"
      meta={`${periods.length} periods`}
      open={open}
      onToggle={setOpen}
      headerExtra={open ? <PeriodStepper reversed={periodOrder.reversed} onToggle={periodOrder.toggle} /> : null}
      title={title}
    >
      <div className={css(styles, "ownership-investor-list")}>
        {categories.map(([category, holders]) => (
          <InvestorCategoryCard category={category} holders={holders} key={category} periods={periods} />
        ))}
      </div>
    </OwnershipSection>
  );
}
