import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { AccordionSection } from "@/components/AccordionSection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CompanySectionNav, type CompanySectionLink } from "@/components/CompanySectionNav";
import { DocumentsTabs } from "@/components/DocumentsTabs";
import { FinancialTable } from "@/components/FinancialTable";
import { ShareholdingPieChart } from "@/components/ShareholdingPieChart";
import { StockChart } from "@/components/StockChart";
import { StockHeader } from "@/components/StockHeader";
import type { CompanyPageModel } from "@/lib/data/company-template";
import { companyHref, formatMetric } from "@/lib/data/format";
import type { Company } from "@/lib/data/types";

function CompanyDatasetPanel({
  company,
  liveFetchedAt,
  liveSource
}: {
  company: Company;
  liveFetchedAt?: string;
  liveSource?: string;
}) {
  const rows = [
    ["Company code", company.code],
    ["Sector", company.sector.name || "-"],
    ["Group", company.group.name || "-"],
    ["Industry", company.industry.name || "-"],
    ["Leaf category", company.leaf.name || "-"],
    ["Live refreshed", liveFetchedAt ? liveFetchedAt.slice(0, 19).replace("T", " ") : "-"],
    ["Last scraped", company.scrapedAt || "-"],
    ["Source page", company.scrapePage || "-"]
  ];

  return (
    <section className="panel">
      <div className="section-title-row">
        <h2>Company dataset</h2>
      </div>
      <div className="listing-data-grid panel-pad">
        {rows.map(([label, value]) => (
          <div className="listing-data-row" key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {company.description || company.scrapeUrl ? (
        <div className="listing-data-note">
          {company.description ? <p>{company.description}</p> : null}
          {liveSource ? (
            <a href={liveSource} rel="noopener noreferrer" target="_blank">
              Live Screener source
            </a>
          ) : null}
          {company.scrapeUrl ? (
            <a href={company.scrapeUrl} rel="noopener noreferrer" target="_blank">
              Source row
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ListingRowPanel({ company }: { company: Company }) {
  return (
    <section className="panel panel-pad">
      <h2>Listing row</h2>
      <div className="metric-row">
        <span className="muted">Market cap</span>
        <span className="numeric">{formatMetric(company.marketCapCr, "crore")}</span>
      </div>
      <div className="metric-row">
        <span className="muted">Sales qtr</span>
        <span className="numeric">{formatMetric(company.salesQtrCr, "crore")}</span>
      </div>
      <div className="metric-row">
        <span className="muted">ROCE</span>
        <span className="numeric">{formatMetric(company.rocePct, "percent")}</span>
      </div>
    </section>
  );
}

export function CompanyPageTemplate({ model }: { model: CompanyPageModel }) {
  const { company, hasFullStockData, leafNode, liveFetchedAt, liveSource, peers, prices, stock } = model;
  const hasProsCons = hasFullStockData && (stock.prosCons.pros.length > 0 || stock.prosCons.cons.length > 0);
  const hasAbout = hasFullStockData && Boolean(stock.overview.about);
  const hasAnalysis = hasProsCons || hasAbout;
  const sectionLinks = [
    { id: "overview", label: stock.overview.companyName || stock.ticker },
    prices.length ? { id: "chart", label: "Chart" } : null,
    hasAnalysis ? { id: "analysis", label: "Analysis" } : null,
    leafNode ? { id: "peers", label: "Peers" } : null,
    hasFullStockData ? { id: "quarters", label: "Quarters" } : null,
    hasFullStockData ? { id: "profit-loss", label: "Profit & Loss" } : null,
    hasFullStockData ? { id: "balance-sheet", label: "Balance Sheet" } : null,
    hasFullStockData ? { id: "cash-flow", label: "Cash Flow" } : null,
    hasFullStockData ? { id: "ratios", label: "Ratios" } : null,
    hasFullStockData ? { id: "investors", label: "Investors" } : null,
    hasFullStockData ? { id: "documents", label: "Documents" } : null
  ].filter((link): link is CompanySectionLink => Boolean(link));

  return (
    <main className="shell page-stack company-page-shell">
      <CompanySectionNav links={sectionLinks} />
      <StockHeader
        company={company}
        hasFullStockData={hasFullStockData}
        id="overview"
        prices={prices}
        stock={stock}
      />

      <section className="stock-layout">
        <div className="stock-main">
          {prices.length ? <StockChart id="chart" points={prices} stock={stock} /> : null}

          {company ? (
            <CompanyDatasetPanel
              company={company}
              liveFetchedAt={liveFetchedAt}
              liveSource={liveSource}
            />
          ) : null}

          {leafNode ? (
            <section className="peer-panel section-anchor" id="peers">
              <Breadcrumbs node={leafNode} title="Peer comparison" variant="peer" />
              {peers.length ? (
                <ul className="peer-list">
                  {peers.map((peer) => (
                    <li key={peer.code}>
                      <Link className="peer-row" href={companyHref(peer.code)}>
                        <span className="peer-name">{peer.name}</span>
                        <span className="numeric">{formatMetric(peer.marketCapCr, "crore")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No listed peers available in this category.</p>
              )}
            </section>
          ) : null}

          <section className="panel">
            <div className="section-title-row">
              <h2>Key metrics</h2>
            </div>
            <div className="grid metric-grid panel-pad">
              {Object.entries(stock.keyMetrics).map(([label, value]) => (
                <div className="metric-card" key={label}>
                  <div className="metric-label">{label}</div>
                  <div className="metric-value">{value}</div>
                </div>
              ))}
            </div>
          </section>

          {hasProsCons ? (
            <section className="grid pros-cons section-anchor" id="analysis">
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

          {hasFullStockData ? (
            <>
              <AccordionSection defaultOpen id="quarters" table={stock.quarterly} title="Quarterly Results" />
              <AccordionSection id="profit-loss" table={stock.profitLoss} title="Profit & Loss" />
              <AccordionSection id="balance-sheet" table={stock.balanceSheet} title="Balance Sheet" />
              <AccordionSection id="cash-flow" table={stock.cashFlows} title="Cash Flows" />
              <AccordionSection id="ratios" table={stock.ratios} title="Ratios" />

              <section className="panel section-anchor" id="investors">
                <div className="section-title-row">
                  <h2>Shareholding Pattern</h2>
                </div>
                <ShareholdingPieChart table={stock.shareholding.quarterly} />
                <FinancialTable table={stock.shareholding.quarterly} />
              </section>

              <section className="panel">
                <div className="section-title-row">
                  <h2>Yearly Shareholding</h2>
                </div>
                <FinancialTable table={stock.shareholding.yearly} />
              </section>

              <DocumentsTabs documents={stock.documents} id="documents" />
            </>
          ) : null}
        </div>

        <aside className="stock-side">
          {company ? <ListingRowPanel company={company} /> : null}

          <section className="panel panel-pad">
            <h2>Category</h2>
            {leafNode ? <Breadcrumbs node={leafNode} /> : <p className="muted">No category data.</p>}
          </section>
        </aside>
      </section>
    </main>
  );
}
