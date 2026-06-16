"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";

import { companyHref, formatIndianNumber, formatMetric } from "@/lib/data/format";

export type Mover = {
  code: string;
  name: string;
  cmp: number | null;
  changePct: number | null;
};

type MarketMoversTabsProps = {
  gainers: Mover[];
  losers: Mover[];
};

const TABS = [
  { id: "gainers", label: "Top Gainers" },
  { id: "losers", label: "Top Losers" }
] as const;

type TabId = (typeof TABS)[number]["id"];

export function MarketMoversTabs({ gainers, losers }: MarketMoversTabsProps) {
  const [active, setActive] = useState<TabId>("gainers");
  const movers = active === "gainers" ? gainers : losers;

  return (
    <div className={css(styles, "dash-movers")}>
      <div className={css(styles, "dash-movers-head")}>
        <h2 className={css(styles, "dash-section-title")}>
          <BarChart3 size={18} aria-hidden="true" />
          Market movers
        </h2>
        <div className={css(styles, "dash-tabs")} role="tablist" aria-label="Market movers">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={css(styles, `dash-tab${active === tab.id ? " active" : ""}`)}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        </div>
      </div>

      <div className={css(styles, "dash-movers-grid")}>
        {movers.map((mover) => {
          const direction = (mover.changePct ?? 0) >= 0 ? "up" : "down";
          return (
            <Link
              key={mover.code}
              href={companyHref(mover.code)}
              className={css(styles, "dash-mover")}
            >
              <span className={css(styles, "dash-mover-name")}>{mover.name}</span>
              <span className={css(styles, "numeric dash-mover-price")}>
                {formatMetric(mover.cmp, "currency")}
              </span>
              <span className={css(styles, `dash-mover-change ${direction}`)}>
                <span aria-hidden="true">{direction === "up" ? "▲" : "▼"}</span>
                {formatIndianNumber(Math.abs(mover.changePct ?? 0), { dp: 2, suffix: "%" })}
              </span>
            </Link>
          );
        })}
      </div>

      <p className={css(styles, "dash-movers-note")}>
        Ranked by latest quarterly profit growth.
      </p>
    </div>
  );
}
