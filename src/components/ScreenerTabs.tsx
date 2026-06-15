"use client";

import Link from "next/link";
import { useState } from "react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { TAB_SCREENS, type ScreenCard } from "@/lib/data/screener-promo";

function ScreenTile({ card }: { card: ScreenCard }) {
  return (
    <Link href="/market/" className={css(styles, "screen-tile")}>
      <span className={css(styles, "screen-tile-name")}>{card.name}</span>
      <span className={css(styles, "screen-tile-rule")}>{card.rule}</span>
      <span className={css(styles, "screen-tile-count")}>{card.count} Stocks</span>
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
