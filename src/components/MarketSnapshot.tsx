import Link from "next/link";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { formatIndianNumber } from "@/lib/data/format";
import { getAllIndices, type MarketIndex } from "@/lib/data/indices-nse";
import { SPARK_H, SPARK_W, sparkPoints } from "@/lib/data/spark";

function SnapshotRow({ index }: { index: MarketIndex }) {
  const direction = (index.changePct ?? 0) >= 0 ? "up" : "down";
  const value = formatIndianNumber(index.value, { dp: 2 });

  return (
    <Link href="/market/" className={css(styles, "snapshot-row")}>
      <span className={css(styles, "snapshot-label")}>{index.label}</span>
      {index.spark.length > 1 ? (
        <svg
          className={css(styles, `snapshot-spark ${direction}`)}
          viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline points={sparkPoints(index.spark)} fill="none" strokeWidth={1.75} />
        </svg>
      ) : (
        <span />
      )}
      <span className={css(styles, "snapshot-figures")}>
        <span className={css(styles, "numeric snapshot-value")}>{value}</span>
        <span className={css(styles, `snapshot-change ${direction}`)}>
          <span aria-hidden="true">{direction === "up" ? "▲" : "▼"}</span>
          {formatIndianNumber(Math.abs(index.changePct ?? 0), { dp: 2, suffix: "%" })}
        </span>
      </span>
    </Link>
  );
}

export function MarketSnapshot() {
  // Landing shows a trimmed set of real NSE indices; the full board lives on
  // /market.
  const indices = getAllIndices().slice(0, 9);
  if (!indices.length) return null;

  return (
    <section className={css(styles, "dash-section")}>
      <div className={css(styles, "dash-section-head")}>
        <h2 className={css(styles, "dash-section-title")}>Market overview</h2>
        <Link className={css(styles, "dash-view-all")} href="/market/">
          See all
        </Link>
      </div>
      <div className={css(styles, "snapshot-panel")}>
        {indices.map((index) => (
          <SnapshotRow key={index.slug} index={index} />
        ))}
      </div>
    </section>
  );
}
