import Link from "next/link";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { formatIndianNumber } from "@/lib/data/format";
import { getMarketOverview, type MarketQuote } from "@/lib/data/indices";
import { SPARK_H, SPARK_W, sparkPoints } from "@/lib/data/spark";

function SnapshotRow({ quote }: { quote: MarketQuote }) {
  const direction = quote.changePct >= 0 ? "up" : "down";
  const value = `${quote.prefix ?? ""}${formatIndianNumber(quote.value, { dp: quote.dp })}`;

  return (
    <div className={css(styles, "snapshot-row")}>
      <span className={css(styles, "snapshot-label")}>{quote.label}</span>
      <svg
        className={css(styles, `snapshot-spark ${direction}`)}
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline points={sparkPoints(quote.spark)} fill="none" strokeWidth={1.75} />
      </svg>
      <span className={css(styles, "snapshot-figures")}>
        <span className={css(styles, "numeric snapshot-value")}>{value}</span>
        <span className={css(styles, `snapshot-change ${direction}`)}>
          <span aria-hidden="true">{direction === "up" ? "▲" : "▼"}</span>
          {formatIndianNumber(Math.abs(quote.changePct), { dp: 2, suffix: "%" })}
        </span>
      </span>
    </div>
  );
}

export function MarketSnapshot() {
  // Landing page shows a trimmed snapshot; the full set lives on /market.
  const quotes = getMarketOverview()
    .flatMap((group) => group.quotes)
    .slice(0, 9);

  return (
    <section className={css(styles, "dash-section")}>
      <div className={css(styles, "dash-section-head")}>
        <h2 className={css(styles, "dash-section-title")}>Market overview</h2>
        <Link className={css(styles, "dash-view-all")} href="/market/">
          See all
        </Link>
      </div>
      <div className={css(styles, "snapshot-panel")}>
        {quotes.map((quote) => (
          <SnapshotRow key={quote.id} quote={quote} />
        ))}
      </div>
    </section>
  );
}
