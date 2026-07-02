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
  { id: "losers", label: "Top Losers" },
  { id: "volume", label: "Volume Shockers" }
] as const;

type TabId = (typeof TABS)[number]["id"];

type VolumeShocker = Mover & {
  volumeMultiple: number;
};

const VOLUME_SHOCKERS: VolumeShocker[] = [
  { code: "NYKAA", name: "FSN E-Commerce", cmp: 265.4, changePct: -1.99, volumeMultiple: 816.5 },
  { code: "LAURUSLABS", name: "Laurus Labs", cmp: 1112.8, changePct: 7.94, volumeMultiple: 248.2 },
  { code: "GLENMARK", name: "Glenmark Pharma", cmp: 2420.8, changePct: 18.52, volumeMultiple: 132.7 },
  { code: "BIOCON", name: "Biocon", cmp: 363.3, changePct: 4.97, volumeMultiple: 93.6 },
  { code: "LUPIN", name: "Lupin", cmp: 2310.9, changePct: -0.26, volumeMultiple: 36.8 },
  { code: "ZYDUSLIFE", name: "Zydus Lifesciences", cmp: 913.7, changePct: 10.28, volumeMultiple: 31.3 },
  { code: "PAYTM", name: "One 97 Communications", cmp: 902.1, changePct: 3.64, volumeMultiple: 28.4 },
  { code: "IDEA", name: "Vodafone Idea", cmp: 7.8, changePct: -2.11, volumeMultiple: 24.9 },
  { code: "YESBANK", name: "Yes Bank", cmp: 20.4, changePct: 1.43, volumeMultiple: 21.6 },
  { code: "SUZLON", name: "Suzlon Energy", cmp: 58.2, changePct: 5.22, volumeMultiple: 18.7 }
];

export function MarketMoversTabs({ gainers, losers }: MarketMoversTabsProps) {
  const [active, setActive] = useState<TabId>("gainers");
  const movers = active === "gainers" ? gainers : active === "losers" ? losers : VOLUME_SHOCKERS;
  const isVolumeTab = active === "volume";

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
          const volumeMultiple =
            "volumeMultiple" in mover && typeof mover.volumeMultiple === "number"
              ? mover.volumeMultiple
              : null;

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
                {volumeMultiple === null ? (
                  <>
                    <span className={css(styles, "dash-mover-icon")} aria-hidden="true" />
                    {formatIndianNumber(Math.abs(mover.changePct ?? 0), { dp: 2, suffix: "%" })}
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">x</span>
                    {formatIndianNumber(volumeMultiple, { dp: 1 })}
                  </>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      <p className={css(styles, "dash-movers-note")}>
        {isVolumeTab
          ? "Dummy data for now; ranked by volume versus average."
          : "Ranked by latest quarterly profit growth."}
      </p>
    </div>
  );
}
