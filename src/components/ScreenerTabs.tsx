"use client";

import Link from "next/link";
import { useState } from "react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { TAB_SCREENS, type ScreenCard } from "@/lib/data/screener-promo";

const SPARK_W = 120;
const SPARK_H = 40;

function sparkPoints(spark: number[]): string {
  if (spark.length < 2) {
    return "";
  }
  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const span = max - min || 1;
  const step = SPARK_W / (spark.length - 1);
  const pad = 4;
  const usable = SPARK_H - pad * 2;

  return spark
    .map((point, i) => {
      const x = i * step;
      const y = pad + (1 - (point - min) / span) * usable;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function ScreenTile({ card }: { card: ScreenCard }) {
  return (
    <Link href="/market/" className={css(styles, "screen-tile")}>
      <span className={css(styles, "screen-tile-name")}>{card.name}</span>
      <span className={css(styles, "screen-tile-rule")}>{card.rule}</span>
      <span className={css(styles, "screen-tile-count")}>{card.count} Stocks</span>
      <svg
        className={css(styles, `screen-tile-spark spark-${card.tone}`)}
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline points={sparkPoints(card.spark)} fill="none" strokeWidth={2} />
      </svg>
    </Link>
  );
}

export function ScreenerTabs() {
  const [active, setActive] = useState(TAB_SCREENS[0].id);
  const current = TAB_SCREENS.find((tab) => tab.id === active) ?? TAB_SCREENS[0];

  return (
    <>
      <div className={css(styles, "screen-tabs")} role="tablist" aria-label="Screens">
        {TAB_SCREENS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === active}
            className={css(styles, `screen-tab${tab.id === active ? " active" : ""}`)}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {current.screens.length > 0 ? (
        <div className={css(styles, "screen-grid")}>
          {current.screens.map((card) => (
            <ScreenTile key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <p className={css(styles, "screen-empty")}>
          You haven&apos;t saved any screens yet. Build one from the market browser.
        </p>
      )}
    </>
  );
}
