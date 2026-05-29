"use client";

import dynamic from "next/dynamic";
import { css } from "@/lib/css-module";
import styles from "./market.module.css";

import type { Company } from "@/lib/data/types";

type MarketTableProps = {
  companies: Company[];
  initialPage?: number;
  pageSize?: number;
};

function MarketTableSkeleton() {
  return (
    <section className={css(styles, "panel market-table-loading")} aria-label="Loading companies">
      <div className={css(styles, "table-toolbar")}>
        <div className={css(styles, "skeleton-line skeleton-input")} />
        <div className={css(styles, "skeleton-line skeleton-count")} />
      </div>
      <div className={css(styles, "market-table-loading-rows")}>
        {Array.from({ length: 8 }, (_, index) => (
          <div className={css(styles, "market-table-loading-row")} key={index}>
            <span className={css(styles, "skeleton-line")} />
            <span className={css(styles, "skeleton-line")} />
            <span className={css(styles, "skeleton-line")} />
            <span className={css(styles, "skeleton-line")} />
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
