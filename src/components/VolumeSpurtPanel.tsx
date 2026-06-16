import Link from "next/link";
import { Flame } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { CompanyLogoMark } from "@/components/CompanyLogoMark";
import { companyHref, formatIndianNumber, formatMetric } from "@/lib/data/format";
import { VOLUME_SPURTS } from "@/lib/data/home-tables";

// Spurt-in-volume list, rendered as bento-tile content. Compact column set so
// it fits a tile: name · today vol (L) · ×avg · LTP · day change.
export function VolumeSpurtPanel() {
  return (
    <>
      <div className={css(styles, "bento-tile-head")}>
        <span className={css(styles, "bento-eyebrow")}>
          <Flame size={14} aria-hidden="true" />
          Spurt in volume
        </span>
        <span className={css(styles, "bento-tile-note")}>vs 2-wk avg</span>
      </div>

      <div className={css(styles, "spurt-table")} role="table">
        <div className={css(styles, "spurt-row spurt-head")} role="row">
          <span role="columnheader">Stock</span>
          <span className={css(styles, "spurt-num")} role="columnheader">
            Vol (L)
          </span>
          <span className={css(styles, "spurt-num")} role="columnheader">
            ×Avg
          </span>
          <span className={css(styles, "spurt-num")} role="columnheader">
            LTP
          </span>
          <span className={css(styles, "spurt-num")} role="columnheader">
            Chg
          </span>
        </div>

        {VOLUME_SPURTS.map((row) => {
          const dir = row.changePct >= 0 ? "up" : "down";
          return (
            <Link
              key={row.code}
              href={companyHref(row.code)}
              className={css(styles, "spurt-row")}
              role="row"
            >
              <span className={css(styles, "spurt-stock")}>
                <CompanyLogoMark code={row.code} name={row.name} size="sm" />
                <span className={css(styles, "spurt-stock-id")}>
                  <span className={css(styles, "spurt-name")}>{row.name}</span>
                  <span className={css(styles, "spurt-ticker")}>{row.code}</span>
                </span>
              </span>
              <span className={css(styles, "numeric spurt-num")}>
                {formatIndianNumber(row.volTodayLac, { dp: 2 })}
              </span>
              <span className={css(styles, "numeric spurt-num spurt-times")}>
                {formatIndianNumber(row.volTimes, { dp: 1, suffix: "×" })}
              </span>
              <span className={css(styles, "numeric spurt-num")}>
                {formatMetric(row.ltp, "currency")}
              </span>
              <span className={css(styles, `numeric spurt-num spurt-change ${dir}`)}>
                {row.changePct >= 0 ? "+" : "−"}
                {formatIndianNumber(Math.abs(row.changePct), { dp: 2, suffix: "%" })}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
