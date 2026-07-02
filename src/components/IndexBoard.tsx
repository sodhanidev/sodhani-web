import Link from "next/link";

import { css } from "@/lib/css-module";
import styles from "./market.module.css";
import { formatIndianNumber } from "@/lib/data/format";
import { getMarketOverview, type MarketQuote } from "@/lib/data/indices";
import { getAllIndices, type MarketIndex } from "@/lib/data/indices-nse";
import { SPARK_H, SPARK_W, sparkPoints } from "@/lib/data/spark";

function signed(value: number | null, dp: number) {
  if (value === null || !Number.isFinite(value)) return "-";
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${formatIndianNumber(Math.abs(value), { dp })}`;
}

// Real NSE index cell: level, day move, and a live advances/declines breadth
// bar. The whole cell links to the index's heatmap + constituents page.
function IndexCell({ index }: { index: MarketIndex }) {
  const dir = (index.changePct ?? 0) >= 0 ? "up" : "down";
  const { advances, declines, unchanged } = index.breadth;
  const total = advances + declines + unchanged || 1;
  const w = (n: number) => `${(n / total) * 100}%`;

  return (
    <Link href="/market/" className={css(styles, "idx-cell idx-link")}>
      <span className={css(styles, "idx-label")}>{index.label}</span>
      <span className={css(styles, "numeric idx-value")}>
        {formatIndianNumber(index.value, { dp: 2 })}
      </span>
      <span className={css(styles, `numeric idx-chg ${dir}`)}>
        {signed(index.changeVal, 2)}
        <span className={css(styles, "idx-chg-pct")}>{signed(index.changePct, 2)}%</span>
      </span>
      <span
        className={css(styles, "idx-breadth")}
        title={`${advances} advancing · ${declines} declining`}
      >
        <span className={css(styles, "idx-breadth-adv")} style={{ width: w(advances) }} />
        <span className={css(styles, "idx-breadth-unch")} style={{ width: w(unchanged) }} />
        <span className={css(styles, "idx-breadth-dec")} style={{ width: w(declines) }} />
      </span>
    </Link>
  );
}

// Commodity / currency cell: no NSE feed, so these stay hand-maintained
// snapshots (indices.ts) with an inline sparkline.
function QuoteCell({ quote }: { quote: MarketQuote }) {
  const dir = quote.changePct >= 0 ? "up" : "down";
  const value = `${quote.prefix ?? ""}${formatIndianNumber(quote.value, { dp: quote.dp })}`;
  const prevClose = quote.value / (1 + quote.changePct / 100);

  return (
    <div className={css(styles, "idx-cell")}>
      <span className={css(styles, "idx-label")}>{quote.label}</span>
      <div className={css(styles, "idx-mid")}>
        <span className={css(styles, "numeric idx-value")}>{value}</span>
        <svg
          className={css(styles, `idx-spark ${dir}`)}
          viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline points={sparkPoints(quote.spark)} fill="none" strokeWidth={1.5} />
        </svg>
      </div>
      <span className={css(styles, `numeric idx-chg ${dir}`)}>
        {signed(quote.value - prevClose, quote.dp)}
        <span className={css(styles, "idx-chg-pct")}>{signed(quote.changePct, 2)}%</span>
      </span>
    </div>
  );
}

// Market snapshot. Indices are real NSE data (clickable → per-index heatmap);
// commodities and currency are hand-maintained snapshots (indices.ts).
export function IndexBoard() {
  const indices = getAllIndices();
  const groups = getMarketOverview();
  const commodities = groups.find((g) => g.id === "commodities")?.quotes ?? [];
  const currency = groups.find((g) => g.id === "currency")?.quotes ?? [];

  return (
    <section className={css(styles, "index-board")} aria-label="Market snapshot">
      {indices.length ? (
        <div className={css(styles, "idx-block")}>
          <div className={css(styles, "idx-block-head")}>
            <h3 className={css(styles, "idx-block-title")}>Indices</h3>
            <Link href="/market/" className={css(styles, "idx-block-link")}>
              All indices →
            </Link>
          </div>
          <div className={css(styles, "idx-grid")}>
            {indices.map((index) => (
              <IndexCell key={index.slug} index={index} />
            ))}
          </div>
        </div>
      ) : null}

      <div className={css(styles, "idx-block")}>
        <h3 className={css(styles, "idx-block-title")}>Commodities</h3>
        <div className={css(styles, "idx-grid")}>
          {commodities.map((quote) => (
            <QuoteCell key={quote.id} quote={quote} />
          ))}
        </div>
      </div>

      <div className={css(styles, "idx-block")}>
        <h3 className={css(styles, "idx-block-title")}>Currency</h3>
        <div className={css(styles, "idx-grid")}>
          {currency.map((quote) => (
            <QuoteCell key={quote.id} quote={quote} />
          ))}
        </div>
      </div>

      <p className={css(styles, "index-note")}>
        Indices from NSE · commodities and currency are indicative snapshots
      </p>
    </section>
  );
}
