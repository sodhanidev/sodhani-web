import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import { CompanySectionNav, type CompanySectionLink } from "@/components/CompanySectionNav";
import { DocumentsTabs } from "@/components/DocumentsTabs";
import { ShareholdingPieChart } from "@/components/ShareholdingPieChart";
import { SiteFooter } from "@/components/SiteFooter";
import { StockChart } from "@/components/StockChart";
import { StockHeader } from "@/components/StockHeader";
import { FinancialPerformanceExperimental } from "@/components/company/FinancialPerformanceExperimental";
import { RelatedStocks } from "@/components/company/RelatedStocks";
import type { CompanyPageModel } from "@/lib/data/company-template";
import { companyCandlestickHref, companyShareholdingHref } from "@/lib/data/format";
import type { FinancialTable as FinancialTableModel, Stock } from "@/lib/data/types";

function hasTable(table: FinancialTableModel) {
  return table.periods.length > 0 && table.rows.length > 0;
}

function hasDocuments(documents: Stock["documents"]) {
  return Object.values(documents).some((items) => items.length > 0);
}

const keyMetricLabels = [
  "Market Cap",
  "Stock P/E",
  "ROCE",
  "ROE",
  "Dividend Yield",
  "High / Low"
];

export function CompanyPageTemplate({ model }: { model: CompanyPageModel }) {
  const { prices, stock } = model;
  const hasChart = prices.length > 0;
  const keyMetrics = keyMetricLabels.flatMap((label) => {
    const value = stock.keyMetrics[label];
    return value ? [{ label, value }] : [];
  });
  const hasKeyMetrics = keyMetrics.length > 0;
  const hasPros = stock.prosCons.pros.length > 0;
  const hasCons = stock.prosCons.cons.length > 0;
  const hasProsCons = hasPros || hasCons;
  const hasAbout = Boolean(stock.overview.about);
  const hasAnalysis = hasProsCons || hasAbout;
  const hasQuarterly = hasTable(stock.quarterly);
  const hasProfitLoss = hasTable(stock.profitLoss);
  const hasBalanceSheet = hasTable(stock.balanceSheet);
  const hasCashFlows = hasTable(stock.cashFlows);
  const hasRatios = hasTable(stock.ratios);
  const hasFinancials = hasQuarterly || hasProfitLoss || hasBalanceSheet || hasCashFlows || hasRatios;
  const hasQuarterlyShareholding = hasTable(stock.shareholding.quarterly);
  const hasYearlyShareholding = hasTable(stock.shareholding.yearly);
  const hasShareholding = hasQuarterlyShareholding || hasYearlyShareholding;
  const hasDocs = hasDocuments(stock.documents);
  const sectionLinks = [
    { id: "overview", label: "Overview" },
    hasAnalysis ? { id: "analysis", label: "Analysis" } : null,
    hasFinancials ? { id: "financials", label: "Financials" } : null,
    hasShareholding ? { id: "shareholding", label: "Shareholding" } : null,
    hasDocs ? { id: "documents", label: "Documents" } : null
  ].filter((link): link is CompanySectionLink => Boolean(link));

  return (
    <>
      <main className={css(styles, "shell page-stack company-page-shell")}>
        <CompanySectionNav links={sectionLinks} />
        <section className={css(styles, "stock-hero")}>
          <StockHeader id="overview" stock={stock} />
          {hasChart ? (
            <StockChart
              advancedHref={companyCandlestickHref(stock.ticker)}
              annualFinancials={stock.profitLoss}
              balanceSheet={stock.balanceSheet}
              faceValueRaw={stock.keyMetrics["Face Value"]}
              id="chart"
              points={prices}
              quarterlyFinancials={stock.quarterly}
            />
          ) : null}
        </section>

        <section className={css(styles, "stock-layout")}>
          <div className={css(styles, "stock-main")}>
            {hasKeyMetrics ? (
              <section className={css(styles, "panel section-anchor")} id="key-metrics">
                <div className={css(styles, "section-title-row")}>
                  <h2>Key Metrics</h2>
                </div>
                <div className={css(styles, "grid metric-grid panel-pad")}>
                  {keyMetrics.map(({ label, value }) => (
                    <div className={css(styles, "metric-card")} key={label}>
                      <div className={css(styles, "metric-label")}>{label}</div>
                      <div className={css(styles, "metric-value")}>{value}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {hasProsCons ? (
              <section className={css(styles, "grid pros-cons section-anchor")} id="analysis">
                {hasPros ? (
                  <div className={css(styles, "panel panel-pad")}>
                    <h2>Pros</h2>
                    <ul className={css(styles, "note-list")}>
                      {stock.prosCons.pros.map((item) => (
                        <li className={css(styles, "positive")} key={item}>
                          <CheckCircle2 size={16} aria-hidden="true" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {hasCons ? (
                  <div className={css(styles, "panel panel-pad")}>
                    <h2>Cons</h2>
                    <ul className={css(styles, "note-list")}>
                      {stock.prosCons.cons.map((item) => (
                        <li className={css(styles, "negative")} key={item}>
                          <AlertTriangle size={16} aria-hidden="true" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            {hasAbout ? (
              <section
                className={css(styles, `panel panel-pad${hasProsCons ? "" : " section-anchor"}`)}
                id={hasProsCons ? undefined : "analysis"}
              >
                <h2>About</h2>
                <p>{stock.overview.about}</p>
              </section>
            ) : null}

            {hasFinancials ? (
              <FinancialPerformanceExperimental
                balanceSheet={stock.balanceSheet}
                cashFlows={stock.cashFlows}
                id="financials"
                quarterly={stock.quarterly}
                ticker={stock.ticker}
                yearly={stock.profitLoss}
              />
            ) : null}

            {hasShareholding ? (
              <section className={css(styles, "panel section-anchor")} id="shareholding">
                <div className={css(styles, "section-title-row")}>
                  <h2>Shareholding Pattern</h2>
                  <Link className={css(styles, "shareholding-detail-link")} href={companyShareholdingHref(stock.ticker)}>
                    Show Detailed Information
                    <ChevronRight size={15} aria-hidden="true" />
                  </Link>
                </div>
                <ShareholdingPieChart
                  table={hasQuarterlyShareholding ? stock.shareholding.quarterly : stock.shareholding.yearly}
                />
              </section>
            ) : null}

            <RelatedStocks peers={model.peers} source={model.peerSource} ticker={stock.ticker} />

            {hasDocs ? <DocumentsTabs documents={stock.documents} id="documents" /> : null}
          </div>
        </section>
      </main>
      <SiteFooter className={css(styles, "company-footer")} />
    </>
  );
}
