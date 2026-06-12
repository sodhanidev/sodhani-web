import { LineChart } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { formatIndianNumber } from "@/lib/data/format";
import { getMarketOverview, type MarketQuote } from "@/lib/data/indices";

const SPARK_W = 120;
const SPARK_H = 34;

// Build an SVG polyline `points` string from the quote's spark series,
// normalized to fit the SPARK_W × SPARK_H box.
function sparkPoints(spark: number[]): string {
  if (spark.length < 2) {
    return "";
  }
  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const span = max - min || 1;
  const step = SPARK_W / (spark.length - 1);
  // Pad vertically so the line never touches the edges.
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

function QuoteCard({ quote }: { quote: MarketQuote }) {
  const direction = quote.changePct >= 0 ? "up" : "down";
  const value = `${quote.prefix ?? ""}${formatIndianNumber(quote.value, { dp: quote.dp })}`;

  return (
    <div className={css(styles, "overview-card")}>
      <span className={css(styles, "overview-label")}>{quote.label}</span>
      <span className={css(styles, "numeric overview-value")}>{value}</span>
      <span className={css(styles, `overview-change ${direction}`)}>
        <span aria-hidden="true">{direction === "up" ? "▲" : "▼"}</span>
        {formatIndianNumber(Math.abs(quote.changePct), { dp: 2, suffix: "%" })}
      </span>
      <svg
        className={css(styles, `overview-spark ${direction}`)}
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline points={sparkPoints(quote.spark)} fill="none" strokeWidth={1.75} />
      </svg>
    </div>
  );
}

export function MarketOverview() {
  const groups = getMarketOverview();
  const quotes = groups.flatMap((group) => group.quotes);

  return (
    <section className={css(styles, "dash-section")}>
      <div className={css(styles, "dash-section-head")}>
        <h2 className={css(styles, "dash-section-title")}>
          <LineChart size={18} aria-hidden="true" />
          Market overview
        </h2>
      </div>
      <div className={css(styles, "overview-grid")}>
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </section>
  );
}
