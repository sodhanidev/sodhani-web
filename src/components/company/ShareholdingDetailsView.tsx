import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { SiteFooter } from "@/components/SiteFooter";
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

function countInvestorHolders(investors: Stock["investors"]) {
  return [investors.quarterly, investors.yearly].reduce((total, groups) => {
    return total + Object.values(groups).reduce((sum, holders) => sum + Object.keys(holders).length, 0);
  }, 0);
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
      <tr className={`${child ? "is-child" : ""}${!child && index === 0 ? " is-highlighted" : ""}`} key={rowKey}>
        <td>
          <span className="ownership-particular">
            {hasChildren ? <span className="ownership-row-mark">+</span> : null}
            {row.label}
          </span>
        </td>
        {periods.map((period) => (
          <td className="numeric" key={`${rowKey}-${period}`}>
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
    <section className="ownership-section" id={id}>
      <div className="ownership-section-heading">
        <div>
          <span>{kicker}</span>
          <h2>{title}</h2>
        </div>
        <p>{table.periods.length} periods</p>
      </div>
      <div className="ownership-table-card">
        <div className="ownership-table-wrap">
          <table className="ownership-table">
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
    <article className="ownership-investor-card">
      <div className="ownership-investor-card-head">
        <h3>{getCategoryLabel(category)}</h3>
        <span>{holderRows.length} holders</span>
      </div>
      <div className="ownership-table-card">
        <div className="ownership-table-wrap">
          <table className="ownership-table ownership-investor-table">
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
                <tr className={index === 0 ? "is-highlighted" : ""} key={holder}>
                  <td>{holder}</td>
                  {periods.map((period) => (
                    <td className="numeric" key={`${holder}-${period}`}>
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
    <section className="ownership-section" id={id}>
      <div className="ownership-section-heading">
        <div>
          <span>Investor Holding</span>
          <h2>{title}</h2>
        </div>
        <p>{periods.length} periods</p>
      </div>
      <div className="ownership-investor-list">
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

  return (
    <>
      <main className="shell page-stack ownership-detail-page">
        <header className="ownership-hero">
          <div>
            <Link className="ownership-back-link" href={companyHref(stock.ticker)}>
              <ArrowLeft size={15} aria-hidden="true" />
              Back to company
            </Link>
            <p className="ownership-eyebrow">{stock.ticker}</p>
            <h1>{stock.overview.companyName}</h1>
            <p>Shareholding pattern, category ownership, and named investor holdings from the static company filings data.</p>
          </div>
          <div className="ownership-summary-grid">
            <div>
              <span>Promoters</span>
              <strong className="numeric">{getLatestTableValue(stock.shareholding.quarterly, "Promoters")}</strong>
            </div>
            <div>
              <span>Public</span>
              <strong className="numeric">{getLatestTableValue(stock.shareholding.quarterly, "Public")}</strong>
            </div>
            <div>
              <span>Named Holders</span>
              <strong className="numeric">{investorHolderCount}</strong>
            </div>
          </div>
        </header>

        <nav className="ownership-jump-nav" aria-label="Shareholding detail sections">
          {hasQuarterlyShareholding ? (
            <a href="#quarterly-shareholding">
              Quarterly Pattern <ChevronRight size={14} aria-hidden="true" />
            </a>
          ) : null}
          {hasYearlyShareholding ? (
            <a href="#yearly-shareholding">
              Yearly Pattern <ChevronRight size={14} aria-hidden="true" />
            </a>
          ) : null}
          {hasQuarterlyInvestors ? (
            <a href="#quarterly-investors">
              Quarterly Investors <ChevronRight size={14} aria-hidden="true" />
            </a>
          ) : null}
          {hasYearlyInvestors ? (
            <a href="#yearly-investors">
              Yearly Investors <ChevronRight size={14} aria-hidden="true" />
            </a>
          ) : null}
        </nav>

        <div className="ownership-detail-stack">
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
      <SiteFooter className="company-footer" />
    </>
  );
}
