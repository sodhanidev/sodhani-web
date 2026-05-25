"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { companyHref, marketHref } from "@/lib/data/format";
import type { Company, IndustryNode } from "@/lib/data/types";

export function SearchResultsClient({
  companies,
  availableStockCodes,
  nodes
}: {
  companies: Company[];
  availableStockCodes: string[];
  nodes: IndustryNode[];
}) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const needle = q.toLowerCase();

  const companyResults = useMemo(
    () =>
      needle
        ? companies
            .filter((company) =>
              `${company.name} ${company.code} ${company.leaf.name}`.toLowerCase().includes(needle)
            )
            .slice(0, 30)
        : [],
    [companies, needle]
  );

  const industryResults = useMemo(
    () =>
      needle
        ? nodes
            .filter((node) =>
              `${node.name} ${node.code} ${node.names.join(" ")}`.toLowerCase().includes(needle)
            )
            .slice(0, 20)
        : [],
    [nodes, needle]
  );
  const available = useMemo(() => new Set(availableStockCodes), [availableStockCodes]);

  return (
    <section className="grid rails-grid">
      <div className="panel panel-pad">
        <h2>Companies</h2>
        <ul className="rail-list">
          {companyResults.map((company) => (
            <li key={`${company.code}-${company.leaf.code}`}>
              {available.has(company.code) ? (
                <Link className="rail-row" href={companyHref(company.code)}>
                  <span className="rail-name">{company.name}</span>
                  <span className="count-badge">{company.code}</span>
                </Link>
              ) : (
                <div className="rail-row">
                  <span className="rail-name">{company.name}</span>
                  <span className="count-badge">{company.code}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="panel panel-pad">
        <h2>Industries</h2>
        <ul className="rail-list">
          {industryResults.map((node) => (
            <li key={node.code}>
              <Link className="rail-row" href={marketHref(node.path)}>
                <span className="rail-name">{node.name}</span>
                <span className="count-badge">{node.companyCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
