import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { AccordionSection } from "@/components/AccordionSection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DocumentsTabs } from "@/components/DocumentsTabs";
import { FinancialTable } from "@/components/FinancialTable";
import { StockChart } from "@/components/StockChart";
import { StockHeader } from "@/components/StockHeader";
import type {
  CompanyPageModel,
  CompanyResearchMetric,
  CompanyResearchPack
} from "@/lib/data/company-template";
import { companyHref, formatMetric } from "@/lib/data/format";
import type { Company } from "@/lib/data/types";

function CompanyDatasetPanel({ company }: { company: Company }) {
  const rows = [
    ["Company code", company.code],
    ["Sector", company.sector.name || "-"],
    ["Group", company.group.name || "-"],
    ["Industry", company.industry.name || "-"],
    ["Leaf category", company.leaf.name || "-"],
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

function toneClass(tone: CompanyResearchMetric["tone"]) {
  return tone ? `tone-${tone}` : "";
}

function ResearchMetricCard({ metric }: { metric: CompanyResearchMetric }) {
  return (
    <div className={`research-metric ${toneClass(metric.tone)}`}>
      <div className="research-metric-top">
        <span className="metric-label">{metric.label}</span>
        <span className="source-pill" data-source={metric.source}>
          {metric.source}
        </span>
      </div>
      <strong className="metric-value numeric">{metric.value}</strong>
    </div>
  );
}

function ResearchPackPanel({ research }: { research: CompanyResearchPack }) {
  return (
    <section className="panel research-panel">
      <div className="section-title-row research-title-row">
        <div>
          <h2>Research pack</h2>
          <p className="research-note">{research.generatedFrom}</p>
        </div>
      </div>

      <div className="research-score-grid panel-pad">
        {research.scores.map((metric) => (
          <ResearchMetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="research-checklist-grid">
        {research.checklist.map((item) => (
          <div className="research-checklist-card" data-verdict={item.verdict} key={item.label}>
            <div className="research-checklist-top">
              <span className="metric-label">{item.label}</span>
              <span className="verdict-pill">{item.verdict}</span>
            </div>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="research-group-list">
        {research.groups.map((group) => (
          <section className="research-group" key={group.title}>
            <h3>{group.title}</h3>
            <div className="research-group-grid">
              {group.metrics.map((metric) => (
                <ResearchMetricCard key={`${group.title}-${metric.label}`} metric={metric} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export function CompanyPageTemplate({ model }: { model: CompanyPageModel }) {
  const { company, hasFullStockData, leafNode, peers, prices, research, stock } = model;

  return (
    <main className="shell page-stack">
      <StockHeader
        company={company}
        hasFullStockData={hasFullStockData}
        prices={prices}
        stock={stock}
      />

      <section className="stock-layout">
        <div className="stock-main">
          {prices.length ? <StockChart points={prices} stock={stock} /> : null}

          {company ? <CompanyDatasetPanel company={company} /> : null}

          {research ? <ResearchPackPanel research={research} /> : null}

          {leafNode ? (
            <section className="peer-panel">
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

          {hasFullStockData && (stock.prosCons.pros.length || stock.prosCons.cons.length) ? (
            <section className="grid pros-cons">
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

          {hasFullStockData && stock.overview.about ? (
            <section className="panel panel-pad">
              <h2>About</h2>
              <p>{stock.overview.about}</p>
            </section>
          ) : null}

          {hasFullStockData ? (
            <>
              <AccordionSection defaultOpen table={stock.quarterly} title="Quarterly Results" />
              <AccordionSection table={stock.profitLoss} title="Profit & Loss" />
              <AccordionSection table={stock.balanceSheet} title="Balance Sheet" />
              <AccordionSection table={stock.cashFlows} title="Cash Flows" />
              <AccordionSection table={stock.ratios} title="Ratios" />

              <section className="panel">
                <div className="section-title-row">
                  <h2>Shareholding Pattern</h2>
                </div>
                <FinancialTable table={stock.shareholding.quarterly} />
              </section>

              <section className="panel">
                <div className="section-title-row">
                  <h2>Yearly Shareholding</h2>
                </div>
                <FinancialTable table={stock.shareholding.yearly} />
              </section>

              <DocumentsTabs documents={stock.documents} />
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
