"use client";

import dynamic from "next/dynamic";

import type { Company } from "@/lib/data/types";

type MarketTableProps = {
  companies: Company[];
  initialPage?: number;
  pageSize?: number;
};

function MarketTableSkeleton() {
  return (
    <section className="panel market-table-loading" aria-label="Loading companies">
      <div className="table-toolbar">
        <div className="skeleton-line skeleton-input" />
        <div className="skeleton-line skeleton-count" />
      </div>
      <div className="market-table-loading-rows">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="market-table-loading-row" key={index}>
            <span className="skeleton-line" />
            <span className="skeleton-line" />
            <span className="skeleton-line" />
            <span className="skeleton-line" />
          </div>
        ))}
      </div>
    </section>
  );
}

const DynamicMarketTable = dynamic<MarketTableProps>(
  () => import("./MarketTable").then((module) => module.MarketTable),
  {
    loading: () => <MarketTableSkeleton />,
    ssr: false
  }
);

export function LazyMarketTable(props: MarketTableProps) {
  return <DynamicMarketTable {...props} />;
}
