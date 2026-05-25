import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { AccordionSection } from "@/components/AccordionSection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DocumentsTabs } from "@/components/DocumentsTabs";
import { FinancialTable } from "@/components/FinancialTable";
import { StockChart } from "@/components/StockChart";
import { StockHeader } from "@/components/StockHeader";
import { getCompanyByCode, getCompanies, getCompaniesForNode, topCompanies } from "@/lib/data/companies";
import { companyHref, formatMetric } from "@/lib/data/format";
import { getNodeByCode } from "@/lib/data/industry";
import { getAvailableStockCodes, getPricePoints, getStock } from "@/lib/data/stocks";
import type { Company, FinancialTable as FinancialTableData, PricePoint, Stock } from "@/lib/data/types";

type PageProps = {
  params: Promise<{ code: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  const codes = new Set<string>();
  getCompanies().forEach((company) => codes.add(company.code.toUpperCase()));
  getAvailableStockCodes().forEach((companyCode) => codes.add(companyCode.toUpperCase()));
  return [...codes].map((companyCode) => ({ code: companyCode }));
}

const emptyFinancialTable: FinancialTableData = { periods: [], rows: [] };

function stockFromCompany(company: Company): Stock {
  return {
    ticker: company.code.toUpperCase(),
    sourceUrl: company.scrapeUrl ?? "",
    overview: {
      companyName: company.name,
      currentPriceRaw: formatMetric(company.cmp, "currency"),
      about: company.description
    },
    keyMetrics: {
      "Current Price": formatMetric(company.cmp, "currency"),
      "P/E": formatMetric(company.pe, "number"),
      "Market Cap": formatMetric(company.marketCapCr, "crore"),
      "Dividend Yield": formatMetric(company.divYieldPct, "percent"),
      "Net Profit Qtr": formatMetric(company.npQtrCr, "crore"),
      "Profit Var": formatMetric(company.profitVarPct, "percent"),
      "Sales Qtr": formatMetric(company.salesQtrCr, "crore"),
      "Sales Var": formatMetric(company.salesVarPct, "percent"),
      "ROCE": formatMetric(company.rocePct, "percent"),
      Sector: company.sector.name || "-",
      Industry: company.industry.name || "-",
      Segment: company.leaf.name || "-"
    },
    prosCons: {
      pros: [],
      cons: []
    },
    quarterly: emptyFinancialTable,
    profitLoss: emptyFinancialTable,
    balanceSheet: emptyFinancialTable,
    cashFlows: emptyFinancialTable,
    ratios: emptyFinancialTable,
    shareholding: {
      quarterly: emptyFinancialTable,
      yearly: emptyFinancialTable
    },
    investors: {
      quarterly: {},
      yearly: {}
    },
    documents: {
      announcements: [],
      annualReports: [],
      creditRatings: [],
      concalls: []
    }
  };
}

function pricePointsFromCompany(company: Company): PricePoint[] {
  if (company.cmp === null) {
    return [];
  }

  return [
    {
      date: company.scrapedAt?.slice(0, 10) || "latest",
      open: company.cmp,
      high: company.cmp,
      low: company.cmp,
      close: company.cmp,
      volume: 0
    }
  ];
}

function CompanyDatasetPanel({ company }: { company: Company }) {
  const rows = [
    ["Company code", company.code],
    ["CMP", formatMetric(company.cmp, "currency")],
    ["P/E", formatMetric(company.pe, "number")],
    ["Market cap", formatMetric(company.marketCapCr, "crore")],
    ["Dividend yield", formatMetric(company.divYieldPct, "percent")],
    ["Net profit quarter", formatMetric(company.npQtrCr, "crore")],
    ["Quarter profit var", formatMetric(company.profitVarPct, "percent")],
    ["Sales quarter", formatMetric(company.salesQtrCr, "crore")],
    ["Quarter sales var", formatMetric(company.salesVarPct, "percent")],
    ["ROCE", formatMetric(company.rocePct, "percent")],
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
  const company = getCompanyByCode(code);
  const stockData = getStock(code);
  if (!stockData && !company) {
    notFound();
  }

  const stock = stockData ?? stockFromCompany(company!);
  const hasFullStockData = Boolean(stockData);
  const prices = stockData ? getPricePoints(code) : company ? pricePointsFromCompany(company) : [];
  const leafNode = company ? getNodeByCode(company.leaf.code) : undefined;
  const peers = leafNode
    ? topCompanies(getCompaniesForNode(leafNode), "marketCapCr", 7)
        .filter((peer) => peer.code !== stock.ticker)
        .slice(0, 6)
    : [];

  return (
    <main className="shell page-stack">
      <StockHeader company={company} prices={prices} stock={stock} />

      <section className="stock-layout">
        <div className="stock-main">
          {hasFullStockData ? <StockChart points={prices} stock={stock} /> : null}

          {company ? <CompanyDatasetPanel company={company} /> : null}

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
