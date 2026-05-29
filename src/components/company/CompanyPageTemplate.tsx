import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { AccordionSection } from "@/components/AccordionSection";
import { CompanySectionNav, type CompanySectionLink } from "@/components/CompanySectionNav";
import { DocumentsTabs } from "@/components/DocumentsTabs";
import { FinancialTable } from "@/components/FinancialTable";
import { InvestorHoldings } from "@/components/InvestorHoldings";
import { ShareholdingPieChart } from "@/components/ShareholdingPieChart";
import { SiteFooter } from "@/components/SiteFooter";
import { StockChart } from "@/components/StockChart";
import { StockHeader } from "@/components/StockHeader";
import type { CompanyPageModel } from "@/lib/data/company-template";
import type { FinancialTable as FinancialTableModel, Stock } from "@/lib/data/types";

function hasTable(table: FinancialTableModel) {
  return table.periods.length > 0 && table.rows.length > 0;
}

function hasDocuments(documents: Stock["documents"]) {
  return Object.values(documents).some((items) => items.length > 0);
}

function hasInvestorData(investors: Stock["investors"]) {
  return [investors.quarterly, investors.yearly].some((groups) =>
    Object.values(groups).some((holders) => Object.keys(holders).length > 0)
  );
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
  const hasQuarterlyShareholding = hasTable(stock.shareholding.quarterly);
  const hasYearlyShareholding = hasTable(stock.shareholding.yearly);
  const hasShareholding = hasQuarterlyShareholding || hasYearlyShareholding;
  const hasInvestors = hasInvestorData(stock.investors);
  const hasDocs = hasDocuments(stock.documents);
  const sectionLinks = [
    { id: "overview", label: "Overview" },
    hasAnalysis ? { id: "analysis", label: "Analysis" } : null,
    hasQuarterly ? { id: "quarters", label: "Quarters" } : null,
    hasProfitLoss ? { id: "profit-loss", label: "Profit & Loss" } : null,
    hasBalanceSheet ? { id: "balance-sheet", label: "Balance Sheet" } : null,
    hasCashFlows ? { id: "cash-flow", label: "Cash Flow" } : null,
    hasRatios ? { id: "ratios", label: "Ratios" } : null,
    hasShareholding ? { id: "shareholding", label: "Shareholding" } : null,
    hasInvestors ? { id: "investors", label: "Investor Holdings" } : null,
    hasDocs ? { id: "documents", label: "Documents" } : null
  ].filter((link): link is CompanySectionLink => Boolean(link));

  return (
    <>
      <main className="shell page-stack company-page-shell">
        <CompanySectionNav links={sectionLinks} />
        <section className="stock-hero">
          <StockHeader id="overview" stock={stock} />
          {hasChart ? <StockChart id="chart" points={prices} /> : null}
        </section>

        <section className="stock-layout">
          <div className="stock-main">
            {hasKeyMetrics ? (
              <section className="panel section-anchor" id="key-metrics">
                <div className="section-title-row">
                  <h2>Key Metrics</h2>
                </div>
                <div className="grid metric-grid panel-pad">
                  {keyMetrics.map(({ label, value }) => (
                    <div className="metric-card" key={label}>
                      <div className="metric-label">{label}</div>
                      <div className="metric-value">{value}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {hasProsCons ? (
              <section className="grid pros-cons section-anchor" id="analysis">
                {hasPros ? (
                  <div className="panel panel-pad">
                    <h2>Pros</h2>
                    <ul className="note-list">
                      {stock.prosCons.pros.map((item) => (
                        <li className="positive" key={item}>
                          <CheckCircle2 size={16} aria-hidden="true" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {hasCons ? (
                  <div className="panel panel-pad">
                    <h2>Cons</h2>
                    <ul className="note-list">
                      {stock.prosCons.cons.map((item) => (
                        <li className="negative" key={item}>
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
                className={`panel panel-pad${hasProsCons ? "" : " section-anchor"}`}
                id={hasProsCons ? undefined : "analysis"}
              >
                <h2>About</h2>
                <p>{stock.overview.about}</p>
              </section>
            ) : null}

            {hasQuarterly ? <AccordionSection defaultOpen id="quarters" table={stock.quarterly} title="Quarterly Results" /> : null}
            {hasProfitLoss ? <AccordionSection id="profit-loss" table={stock.profitLoss} title="Profit & Loss" /> : null}
            {hasBalanceSheet ? <AccordionSection id="balance-sheet" table={stock.balanceSheet} title="Balance Sheet" /> : null}
            {hasCashFlows ? <AccordionSection id="cash-flow" table={stock.cashFlows} title="Cash Flows" /> : null}
            {hasRatios ? <AccordionSection id="ratios" table={stock.ratios} title="Ratios" /> : null}

            {hasShareholding ? (
              <section className="panel section-anchor" id="shareholding">
                {hasQuarterlyShareholding ? (
                  <>
                    <div className="section-title-row">
                      <h2>Shareholding Pattern</h2>
                    </div>
                    <ShareholdingPieChart table={stock.shareholding.quarterly} />
                    <FinancialTable table={stock.shareholding.quarterly} />
                  </>
                ) : null}
                {hasYearlyShareholding ? (
                  <>
                    <div className="section-title-row">
                      <h2>Yearly Shareholding</h2>
                    </div>
                    <FinancialTable table={stock.shareholding.yearly} />
                  </>
                ) : null}
              </section>
            ) : null}

            {hasInvestors ? <InvestorHoldings id="investors" investors={stock.investors} /> : null}
            {hasDocs ? <DocumentsTabs documents={stock.documents} id="documents" /> : null}
          </div>
        </section>
      </main>
      <SiteFooter className="company-footer" />
    </>
  );
}
