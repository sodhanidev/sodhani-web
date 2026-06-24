import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import { SiteFooter } from "@/components/SiteFooter";
import { MetricCardGrid, type MetricCardItem } from "@/components/company/MetricCardGrid";
import { InvestorDetailsSection, ShareholdingTable } from "@/components/company/ShareholdingTables";
import type { CompanyPageModel } from "@/lib/data/company-template";
import { companyHref, limitTablePeriods } from "@/lib/data/format";
import type { FinancialTable, Stock } from "@/lib/data/types";

type InvestorGroups = Stock["investors"]["quarterly"];

function hasTable(table: FinancialTable) {
  return table.periods.length > 0 && table.rows.length > 0;
}

function hasInvestorGroups(groups: InvestorGroups) {
  return Object.values(groups).some((holders) => Object.keys(holders).length > 0);
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
            table={limitTablePeriods(stock.shareholding.quarterly)}
            title="Quarterly Shareholding"
          />
          <ShareholdingTable
            id="yearly-shareholding"
            kicker="Shareholding Pattern"
            table={limitTablePeriods(stock.shareholding.yearly)}
            title="Yearly Shareholding"
          />
          <InvestorDetailsSection
            groups={stock.investors.quarterly}
            id="quarterly-investors"
            preferredPeriods={limitTablePeriods(stock.shareholding.quarterly).periods}
            title="Quarterly Investor Holdings"
          />
          <InvestorDetailsSection
            groups={stock.investors.yearly}
            id="yearly-investors"
            preferredPeriods={limitTablePeriods(stock.shareholding.yearly).periods}
            title="Yearly Investor Holdings"
          />
        </div>
      </main>
      <SiteFooter className={css(styles, "company-footer")} />
    </>
  );
}
