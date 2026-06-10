import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import { SiteFooter } from "@/components/SiteFooter";
import { MetricCardGrid, type MetricCardItem } from "@/components/company/MetricCardGrid";
import type { CompanyPageModel } from "@/lib/data/company-template";
import { companyHref } from "@/lib/data/format";
import type { FinRow, FinancialTable, Stock } from "@/lib/data/types";

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

function hasInvestorGroups(groups: InvestorGroups) {
  return Object.values(groups).some((holders) => Object.keys(holders).length > 0);
}

function getCategoryLabel(category: string) {
  return categoryLabels[category] ?? category.replace(/_/gu, " ");
}

function getLatestTableValue(table: FinancialTable, label: string) {
  const period = table.periods.at(-1);
  if (!period) {
    return "-";
  }

  const row = table.rows.find((item) => item.label.toLowerCase() === label.toLowerCase());
  return row?.values[period] || "-";
}

function getLatestPeriod(table: FinancialTable) {
  return table.periods.at(-1) ?? "-";
}

function countInvestorHolders(investors: Stock["investors"]) {
  return [investors.quarterly, investors.yearly].reduce((total, groups) => {
    return total + Object.values(groups).reduce((sum, holders) => sum + Object.keys(holders).length, 0);
  }, 0);
}

function countInvestorGroupHolders(groups: InvestorGroups) {
  return Object.values(groups).reduce((sum, holders) => sum + Object.keys(holders).length, 0);
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

function ShareholdingRows({
  rows,
  periods,
  child = false
}: {
  rows: FinRow[];
  periods: string[];
  child?: boolean;
}) {
  return rows.flatMap((row, index) => {
    const rowKey = `${row.label}-${child ? "child" : "row"}`;
    const hasChildren = row.children.length > 0;

    return [
      <tr className={css(styles, `${child ? "is-child" : ""}${!child && index === 0 ? " is-highlighted" : ""}`)} key={rowKey}>
        <td>
          <span className={css(styles, "ownership-particular")}>
            {hasChildren ? <span className={css(styles, "ownership-row-mark")}>+</span> : null}
            {row.label}
          </span>
        </td>
        {periods.map((period) => (
          <td className={css(styles, "numeric")} key={`${rowKey}-${period}`}>
            {row.values[period] || "-"}
          </td>
        ))}
      </tr>,
      hasChildren ? <ShareholdingRows child key={`${rowKey}-children`} periods={periods} rows={row.children} /> : null
    ];
  });
}

function ShareholdingTable({
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
  if (!hasTable(table)) {
    return null;
  }

  return (
    <section className={css(styles, "ownership-section")} id={id}>
      <div className={css(styles, "ownership-section-heading")}>
        <div>
          <span>{kicker}</span>
          <h2>{title}</h2>
        </div>
        <p>
          {table.periods.length} periods · latest {getLatestPeriod(table)}
        </p>
      </div>
      <div className={css(styles, "ownership-table-card")}>
        <div className={css(styles, "ownership-table-wrap")}>
          <table className={css(styles, "ownership-table")}>
            <thead>
              <tr>
                <th>Particulars</th>
                {table.periods.map((period) => (
                  <th key={period}>{period}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ShareholdingRows periods={table.periods} rows={table.rows} />
            </tbody>
          </table>
        </div>
      </div>
    </section>
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

function InvestorDetailsSection({
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

  if (!categories.length) {
    return null;
  }

  const periods = getInvestorPeriods(groups, preferredPeriods);

  return (
    <section className={css(styles, "ownership-section")} id={id}>
      <div className={css(styles, "ownership-section-heading")}>
        <div>
          <span>Investor Holding</span>
          <h2>{title}</h2>
        </div>
        <p>{periods.length} periods</p>
      </div>
      <div className={css(styles, "ownership-investor-list")}>
        {categories.map(([category, holders]) => (
          <InvestorCategoryCard category={category} holders={holders} key={category} periods={periods} />
        ))}
      </div>
    </section>
  );
}

export function ShareholdingDetailsView({ model }: { model: CompanyPageModel }) {
  const { stock } = model;
  const hasQuarterlyShareholding = hasTable(stock.shareholding.quarterly);
  const hasYearlyShareholding = hasTable(stock.shareholding.yearly);
  const hasQuarterlyInvestors = hasInvestorGroups(stock.investors.quarterly);
  const hasYearlyInvestors = hasInvestorGroups(stock.investors.yearly);
  const investorHolderCount = countInvestorHolders(stock.investors);
  const toPatternMetric = (label: string): MetricCardItem => {
    const value = getLatestTableValue(stock.shareholding.quarterly, label);

    if (value === "-") {
      return {
        badge: { label: "N/A", tone: "unavailable" },
        label,
        value: "Unavailable"
      };
    }

    return {
      detail: getLatestPeriod(stock.shareholding.quarterly),
      label,
      value
    };
  };
  const summaryItems: MetricCardItem[] = [
    toPatternMetric("Promoters"),
    toPatternMetric("FIIs"),
    toPatternMetric("DIIs"),
    toPatternMetric("Public"),
    toPatternMetric("Government"),
    {
      detail: "quarterly + yearly",
      label: "Named Holders",
      value: String(investorHolderCount)
    },
    {
      detail: `${stock.shareholding.quarterly.periods.length} periods`,
      label: "Latest Quarter",
      value: getLatestPeriod(stock.shareholding.quarterly)
    },
    {
      detail: `${stock.shareholding.yearly.periods.length} periods`,
      label: "Latest Year",
      value: getLatestPeriod(stock.shareholding.yearly)
    }
  ];

  return (
    <>
      <main className={css(styles, "shell page-stack ownership-detail-page")}>
        <header className={css(styles, "ownership-hero")}>
          <div>
            <Link className={css(styles, "ownership-back-link")} href={companyHref(stock.ticker)}>
              <ArrowLeft size={15} aria-hidden="true" />
              Back to company
            </Link>
            <p className={css(styles, "ownership-eyebrow")}>{stock.ticker}</p>
            <h1>Shareholding</h1>
            <p className={css(styles, "ownership-company-name")}>{stock.overview.companyName}</p>
          </div>
          <p className={css(styles, "ownership-unit-note")}>Pattern values in %</p>
        </header>

        <section className={css(styles, "metric-summary-band")} aria-label="Latest shareholding snapshot">
          <MetricCardGrid className="metric-grid-wide" items={summaryItems} />
        </section>

        <div className={css(styles, "ownership-control-row")}>
          <nav className={css(styles, "ownership-jump-nav")} aria-label="Shareholding detail sections">
            {hasQuarterlyShareholding ? (
              <a href="#quarterly-shareholding">
                <span>Quarterly Pattern</span>
                <small>{stock.shareholding.quarterly.periods.length} periods</small>
              </a>
            ) : null}
            {hasYearlyShareholding ? (
              <a href="#yearly-shareholding">
                <span>Yearly Pattern</span>
                <small>{stock.shareholding.yearly.periods.length} periods</small>
              </a>
            ) : null}
            {hasQuarterlyInvestors ? (
              <a href="#quarterly-investors">
                <span>Quarterly Investors</span>
                <small>{countInvestorGroupHolders(stock.investors.quarterly)} holders</small>
              </a>
            ) : null}
            {hasYearlyInvestors ? (
              <a href="#yearly-investors">
                <span>Yearly Investors</span>
                <small>{countInvestorGroupHolders(stock.investors.yearly)} holders</small>
              </a>
            ) : null}
          </nav>
        </div>

        <div className={css(styles, "ownership-detail-stack")}>
          <ShareholdingTable
            id="quarterly-shareholding"
            kicker="Shareholding Pattern"
            table={stock.shareholding.quarterly}
            title="Quarterly Shareholding"
          />
          <ShareholdingTable
            id="yearly-shareholding"
            kicker="Shareholding Pattern"
            table={stock.shareholding.yearly}
            title="Yearly Shareholding"
          />
          <InvestorDetailsSection
            groups={stock.investors.quarterly}
            id="quarterly-investors"
            preferredPeriods={stock.shareholding.quarterly.periods}
            title="Quarterly Investor Holdings"
          />
          <InvestorDetailsSection
            groups={stock.investors.yearly}
            id="yearly-investors"
            preferredPeriods={stock.shareholding.yearly.periods}
            title="Yearly Investor Holdings"
          />
        </div>
      </main>
      <SiteFooter className={css(styles, "company-footer")} />
    </>
  );
}
