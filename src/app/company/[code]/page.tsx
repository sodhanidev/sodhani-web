import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { AccordionSection } from "@/components/AccordionSection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DocumentsTabs } from "@/components/DocumentsTabs";
import { FinancialTable } from "@/components/FinancialTable";
import { StockChart } from "@/components/StockChart";
import { StockHeader } from "@/components/StockHeader";
import { getCompanyByCode, getCompanies, getCompaniesForNode, topCompanies } from "@/lib/data/companies";
import { formatMetric } from "@/lib/data/format";
import { getNodeByCode } from "@/lib/data/industry";
import { getAvailableStockCodes, getPricePoints, getStock } from "@/lib/data/stocks";

type PageProps = {
  params: Promise<{ code: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAvailableStockCodes().map((companyCode) => ({ code: companyCode }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const stock = getStock(code);
  const company = getCompanyByCode(code);
  return {
    title: stock
      ? `${stock.overview.companyName} · ${stock.ticker}`
      : company
        ? `${company.name} · ${company.code}`
        : "Company",
    description: stock
      ? `Research page for ${stock.overview.companyName}.`
      : company
        ? `Listing page for ${company.name}.`
        : "Company research page."
  };
}

export default async function CompanyPage({ params }: PageProps) {
  const { code } = await params;
  getCompanies();
  const company = getCompanyByCode(code);
  const stock = getStock(code);
  if (!stock) {
    notFound();
  }

  const prices = getPricePoints(code);
  const leafNode = company ? getNodeByCode(company.leaf.code) : undefined;
  const peers = leafNode
    ? topCompanies(getCompaniesForNode(leafNode), "marketCapCr", 6).filter(
        (peer) => peer.code !== stock.ticker
      )
    : [];

  return (
    <main className="shell page-stack">
      <StockHeader company={company} prices={prices} stock={stock} />

      <section className="stock-layout">
        <div className="stock-main">
          <StockChart points={prices} stock={stock} />

          {leafNode ? (
            <section className="peer-panel">
              <Breadcrumbs node={leafNode} title="Peer comparison" variant="peer" />
              {peers.length ? (
                <ul className="peer-list">
                  {peers.map((peer) => (
                    <li key={peer.code}>
                      <div>
                        <span className="peer-name">{peer.name}</span>
                        <span className="numeric">{formatMetric(peer.marketCapCr, "crore")}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
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

          {stock.prosCons.pros.length || stock.prosCons.cons.length ? (
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

          {stock.overview.about ? (
            <section className="panel panel-pad">
              <h2>About</h2>
              <p>{stock.overview.about}</p>
            </section>
          ) : null}

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
        </div>

        <aside className="stock-side">
          {company ? (
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
          ) : null}

          <section className="panel panel-pad">
            <h2>Category</h2>
            {leafNode ? <Breadcrumbs node={leafNode} /> : <p className="muted">No category data.</p>}
          </section>
        </aside>
      </section>
    </main>
  );
}
