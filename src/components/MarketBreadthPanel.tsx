import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { formatIndianNumber } from "@/lib/data/format";
import { SPARK_H, SPARK_W, sparkPoints } from "@/lib/data/spark";
import { getMarketBreadth } from "@/lib/data/ra-calls";

// Market breadth + India VIX, rendered as bento-tile content (no outer chrome —
// the parent grid wraps this in a .bento-tile). Split out of MarketOverview.
export function MarketBreadthPanel() {
  const breadth = getMarketBreadth();
  const total = breadth.advances + breadth.unchanged + breadth.declines || 1;
  const advPct = (breadth.advances / total) * 100;
  const unchPct = (breadth.unchanged / total) * 100;
  const decPct = (breadth.declines / total) * 100;
  const vixDir = breadth.vixChangePct >= 0 ? "up" : "down";

  return (
    <>
      <div className={css(styles, "bento-tile-head")}>
        <span className={css(styles, "bento-eyebrow")}>Market breadth</span>
        <span className={css(styles, "bento-tile-note")}>
          {formatIndianNumber(total)} companies · by quarterly profit growth
        </span>
      </div>

      <div className={css(styles, "breadth-bar")} aria-hidden="true">
        <span className={css(styles, "breadth-seg adv")} style={{ width: `${advPct}%` }} />
        <span className={css(styles, "breadth-seg unch")} style={{ width: `${unchPct}%` }} />
        <span className={css(styles, "breadth-seg dec")} style={{ width: `${decPct}%` }} />
      </div>

      <div className={css(styles, "breadth-stats")}>
        <div className={css(styles, "breadth-stat")}>
          <span className={css(styles, "numeric breadth-num adv")}>
            {formatIndianNumber(breadth.advances)}
          </span>
          <span className={css(styles, "breadth-cap")}>Advances</span>
        </div>
        <div className={css(styles, "breadth-stat")}>
          <span className={css(styles, "numeric breadth-num unch")}>
            {formatIndianNumber(breadth.unchanged)}
          </span>
          <span className={css(styles, "breadth-cap")}>Unchanged</span>
        </div>
        <div className={css(styles, "breadth-stat")}>
          <span className={css(styles, "numeric breadth-num dec")}>
            {formatIndianNumber(breadth.declines)}
          </span>
          <span className={css(styles, "breadth-cap")}>Declines</span>
        </div>
      </div>

      <div className={css(styles, "breadth-vix")}>
        <div className={css(styles, "breadth-vix-text")}>
          <span className={css(styles, "breadth-vix-label")}>India VIX</span>
          <span className={css(styles, "numeric breadth-vix-val")}>
            {formatIndianNumber(breadth.vix, { dp: 2 })}
          </span>
          <span className={css(styles, `breadth-vix-change ${vixDir}`)}>
            <span aria-hidden="true">{vixDir === "up" ? "▲" : "▼"}</span>
            {formatIndianNumber(Math.abs(breadth.vixChangePct), { dp: 2, suffix: "%" })}
          </span>
        </div>
        <svg
          className={css(styles, `breadth-vix-spark ${vixDir}`)}
          viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline points={sparkPoints(breadth.vixSpark)} fill="none" strokeWidth={1.75} />
        </svg>
      </div>
    </>
  );
}
