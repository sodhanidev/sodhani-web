import { css } from "@/lib/css-module";
import styles from "./market.module.css";
import { formatIndianNumber } from "@/lib/data/format";
import { getMarketOverview, type MarketQuote } from "@/lib/data/indices";
import { SPARK_H, SPARK_W, sparkPoints } from "@/lib/data/spark";

// Absolute point move, derived from the % change vs previous close.
function pointChange(quote: MarketQuote): number {
  const prevClose = quote.value / (1 + quote.changePct / 100);
  return quote.value - prevClose;
}

function signed(value: number, dp: number) {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${formatIndianNumber(Math.abs(value), { dp })}`;
}

// One compact quote cell: label, value + sparkline, then point move and %.
function IndexCell({ quote }: { quote: MarketQuote }) {
  const dir = quote.changePct >= 0 ? "up" : "down";
  const value = `${quote.prefix ?? ""}${formatIndianNumber(quote.value, { dp: quote.dp })}`;

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
        {signed(pointChange(quote), quote.dp)}
        <span className={css(styles, "idx-chg-pct")}>{signed(quote.changePct, 2)}%</span>
      </span>
    </div>
  );
}

// Market snapshot packed into a dense auto-fitting grid-table: every index,
// commodity and currency as a tight bordered cell with value, trend and move.
// Values are hand-maintained snapshots (indices.ts), not live quotes.
export function IndexBoard() {
  const quotes = getMarketOverview().flatMap((group) => group.quotes);

  return (
    <section className={css(styles, "index-board")} aria-label="Market snapshot">
      <div className={css(styles, "idx-grid")}>
        {quotes.map((quote) => (
          <IndexCell key={quote.id} quote={quote} />
        ))}
      </div>
      <p className={css(styles, "index-note")}>Indicative snapshot · not live quotes</p>
    </section>
  );
}
