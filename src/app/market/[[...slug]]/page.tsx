import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { css } from "@/lib/css-module";
import styles from "@/components/market.module.css";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LazyMarketTable } from "@/components/LazyMarketTable";
import { MetricRail } from "@/components/MetricRail";
import { SectorCard } from "@/components/SectorCard";
import { CompanyLogoMark } from "@/components/CompanyLogoMark";
import { getCompanies, getCompaniesForNode, getTopCompaniesForNode, topCompanies } from "@/lib/data/companies";
import { companyHref, formatIndianNumber, formatMetric, marketHref } from "@/lib/data/format";
import { getIndustryData, getNodeByPath } from "@/lib/data/industry";
import type { Company } from "@/lib/data/types";

const PAGE_SIZE = 25;
export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

function parseSlug(slug: string[] = []) {
  const pageMarkerIndex = slug.lastIndexOf("page");
  if (pageMarkerIndex !== -1) {
    const page = Number(slug[pageMarkerIndex + 1] ?? "1");
    return {
      pathParts: slug.slice(0, pageMarkerIndex),
      page: Number.isFinite(page) && page > 0 ? page : 1
    };
  }

  return {
    pathParts: slug,
    page: 1
  };
}

function metricTotal(companies: Company[], key: "marketCapCr" | "salesQtrCr" | "npQtrCr") {
  return companies.reduce((sum, company) => sum + (company[key] ?? 0), 0);
}

function metricAverage(companies: Company[], key: "rocePct" | "profitVarPct") {
  const values = companies
    .map((company) => company[key])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatCroreCompact(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  if (Math.abs(value) >= 100_000) {
    return `₹ ${formatIndianNumber(value / 100_000, { dp: 1 })} L Cr`;
  }

  if (Math.abs(value) >= 1_000) {
    return `₹ ${formatIndianNumber(value / 1_000, { dp: 1 })} K Cr`;
  }

  return formatMetric(value, "crore");
}

function toneFromValue(value: number | null) {
  if (value === null) {
    return undefined;
  }

  return value >= 0 ? "up" : "down";
}

function MetricStat({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className={css(styles, "market-stat")}>
      <span>{label}</span>
      <strong className={css(styles, "numeric", tone)}>{value}</strong>
    </div>
  );
}

function changeTone(value: number | null) {
  if (value === null) {
    return "flat";
  }

  return value >= 0 ? "up" : "down";
}

function changeText(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${value >= 0 ? "▲" : "▼"} ${formatIndianNumber(Math.abs(value), { dp: 2 })}%`;
}

function MostBoughtStocks({ companies }: { companies: Company[] }) {
  return (
    <section className={css(styles, "market-showcase-section market-stock-strip")} aria-labelledby="most-bought-title">
      <div className={css(styles, "market-section-head")}>
        <div>
          <h1 id="most-bought-title">Most-bought Stocks</h1>
          <p>Popular large-cap names from the current Indian equity universe.</p>
        </div>
      </div>
      <div className={css(styles, "market-stock-grid")}>
        {companies.map((company) => (
          <Link className={css(styles, "market-stock-tile")} href={companyHref(company.code)} key={company.code}>
            <CompanyLogoMark code={company.code} name={company.name} size="lg" />
            <span className={css(styles, "market-stock-copy")}>
              <strong>{company.name}</strong>
              <span className={css(styles, `market-change ${changeTone(company.profitVarPct)}`)}>
                {changeText(company.profitVarPct)}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ThemeControls() {
  return (
    <div className={css(styles, "theme-controls")} aria-hidden="true">
      <button type="button" disabled>
        <ChevronLeft size={22} />
      </button>
      <button type="button" disabled>
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

export function generateStaticParams() {
  getCompanies();
  const params: { slug?: string[] }[] = [{ slug: [] }];
  const { nodes } = getIndustryData();

  nodes.forEach((node) => {
    const companies = getCompaniesForNode(node);
    const totalPages = Math.max(1, Math.ceil(companies.length / PAGE_SIZE));
    params.push({ slug: node.path });
    for (let page = 2; page <= totalPages; page += 1) {
      params.push({ slug: [...node.path, "page", String(page)] });
    }
  });

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  const parsed = parseSlug(slug);
  const node = getNodeByPath(parsed.pathParts);

  return {
    title: node ? `${node.name} Companies` : "Market",
    description: node
      ? `Browse ${node.companyCount} companies in ${node.name}.`
      : "Browse Indian companies by sector and industry."
  };
}

export default async function MarketPage({ params }: PageProps) {
  const { slug = [] } = await params;
  const parsed = parseSlug(slug);
  const allCompanies = getCompanies();
  const { roots, nodes } = getIndustryData();

  if (parsed.pathParts.length === 0) {
    const totalCompanies = roots.reduce((sum, node) => sum + node.companyCount, 0);
    const leaders = topCompanies(allCompanies, "marketCapCr", 10);

    return (
      <main className={css(styles, "shell page-stack market-page-shell")}>
        <MostBoughtStocks companies={leaders} />
        <section className={css(styles, "market-showcase-section market-themes-section")} aria-labelledby="themes-title">
          <div className={css(styles, "market-section-head")}>
            <div>
              <h2 id="themes-title">Trending Themes</h2>
              <p>
                {formatIndianNumber(totalCompanies)} companies across {formatIndianNumber(roots.length)} sectors.
              </p>
            </div>
            <ThemeControls />
          </div>
          <div className={css(styles, "grid sector-grid")}>
            {roots.map((node) => (
              <SectorCard
                key={node.code}
                leaders={getTopCompaniesForNode(node.code, "marketCapCr", 2)}
                node={node}
              />
            ))}
          </div>
        </section>
      </main>
    );
  }

  const node = getNodeByPath(parsed.pathParts);
  if (!node) {
    notFound();
  }

  const companies = getCompaniesForNode(node);
  const children = node.children.map((code) => nodes.get(code)).filter(Boolean);
  const categoryMarketCap = metricTotal(companies, "marketCapCr");
  const categorySales = metricTotal(companies, "salesQtrCr");
  const categoryRoce = metricAverage(companies, "rocePct");

  return (
    <main className={css(styles, "shell page-stack market-page-shell")}>
      <Breadcrumbs node={node} />
      <section className={css(styles, "market-hero market-node-hero")}>
        <div className={css(styles, "market-hero-copy")}>
          <div className={css(styles, "eyebrow")}>Industry browser</div>
          <h1>{node.name} Companies</h1>
          <p className={css(styles, "lede")}>
            {formatIndianNumber(companies.length)} companies
            {node.description ? ` · ${node.description}` : ""}
          </p>
        </div>
        <div className={css(styles, "market-stat-strip")}>
          <MetricStat label="Companies" value={formatIndianNumber(companies.length)} />
          <MetricStat label="Market cap" value={formatCroreCompact(categoryMarketCap)} />
          <MetricStat label="Sales qtr" value={formatCroreCompact(categorySales)} />
          <MetricStat label="Avg ROCE" value={formatMetric(categoryRoce, "percent")} tone={toneFromValue(categoryRoce)} />
        </div>
        {children.length ? (
          <div className={css(styles, "child-strip")}>
            {children.map((child) =>
              child ? (
                <Link className={css(styles, "pill-button")} href={marketHref(child.path)} key={child.code}>
                  {child.name}
                  <span className={css(styles, "count-badge")}>{formatIndianNumber(child.companyCount)}</span>
                </Link>
              ) : null
            )}
          </div>
        ) : null}
      </section>
      {companies.length ? (
        <>
          <LazyMarketTable
            companies={companies}
            initialPage={parsed.page}
            pageSize={PAGE_SIZE}
          />
          {companies.length >= 3 ? (
            <div className={css(styles, "grid rails-grid")}>
              <MetricRail metric="marketCapCr" companies={topCompanies(companies, "marketCapCr", 5)} />
              <MetricRail metric="rocePct" companies={topCompanies(companies, "rocePct", 5)} />
              <MetricRail metric="profitVarPct" companies={topCompanies(companies, "profitVarPct", 5)} />
            </div>
          ) : null}
        </>
      ) : (
        <section className={css(styles, "empty-state")}>
          <h2>No companies available</h2>
          <p>No companies found for this category.</p>
        </section>
      )}
    </main>
  );
}
