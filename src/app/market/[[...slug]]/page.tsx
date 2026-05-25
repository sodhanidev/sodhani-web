import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MarketTable } from "@/components/MarketTable";
import { SectorCard } from "@/components/SectorCard";
import { getCompanies, getCompaniesForNode, topCompanies } from "@/lib/data/companies";
import { formatIndianNumber, marketHref } from "@/lib/data/format";
import { getIndustryData, getNodeByPath } from "@/lib/data/industry";
import { getAvailableStockCodes } from "@/lib/data/stocks";

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
  getCompanies();
  const { roots, nodes } = getIndustryData();
  const availableStockCodes = getAvailableStockCodes();

  if (parsed.pathParts.length === 0) {
    return (
      <main className="shell page-stack">
        <section className="node-head">
          <div>
            <div className="eyebrow">Market</div>
            <h1>Industries</h1>
            <p className="lede">
              {formatIndianNumber(roots.reduce((sum, node) => sum + node.companyCount, 0))} companies
              across {formatIndianNumber(roots.length)} sectors.
            </p>
          </div>
        </section>
        <div className="grid sector-grid">
          {roots.map((node) => (
            <SectorCard
              key={node.code}
              leaders={topCompanies(getCompaniesForNode(node), "marketCapCr", 3)}
              node={node}
            />
          ))}
        </div>
      </main>
    );
  }

  const node = getNodeByPath(parsed.pathParts);
  if (!node) {
    notFound();
  }

  const companies = getCompaniesForNode(node);
  const children = node.children.map((code) => nodes.get(code)).filter(Boolean);

  return (
    <main className="shell page-stack">
      <Breadcrumbs node={node} />
      <section className="node-head">
        <div>
          <div className="eyebrow">Industry browser</div>
          <h1>{node.name} Companies</h1>
          <p className="lede">
            {formatIndianNumber(companies.length)} companies
            {node.description ? ` · ${node.description}` : ""}
          </p>
        </div>
        {children.length ? (
          <div className="child-strip">
            {children.map((child) =>
              child ? (
                <Link className="pill-button" href={marketHref(child.path)} key={child.code}>
                  {child.name}
                  <span className="count-badge">{formatIndianNumber(child.companyCount)}</span>
                </Link>
              ) : null
            )}
          </div>
        ) : null}
      </section>
      {companies.length ? (
        <MarketTable
          availableStockCodes={availableStockCodes}
          companies={companies}
          initialPage={parsed.page}
          pageSize={PAGE_SIZE}
        />
      ) : (
        <section className="empty-state">
          <h2>No companies available</h2>
          <p>No companies found for this category.</p>
        </section>
      )}
    </main>
  );
}
