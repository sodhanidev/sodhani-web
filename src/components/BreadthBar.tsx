import { css } from "@/lib/css-module";
import styles from "./indices.module.css";
import { formatIndianNumber } from "@/lib/data/format";
import type { IndexBreadth } from "@/lib/data/indices-nse";

// Horizontal advances/declines/unchanged bar, segments sized proportional to
// counts.
export function BreadthBar({ breadth }: { breadth: IndexBreadth }) {
  const { advances, declines, unchanged } = breadth;
  const total = advances + declines + unchanged || 1;
  const pct = (n: number) => `${((n / total) * 100).toFixed(2)}%`;

  return (
    <div className={css(styles, "breadth")}>
      <div className={css(styles, "breadth-bar")} role="img" aria-label={`${advances} advancing, ${declines} declining, ${unchanged} unchanged`}>
        <span className={css(styles, "breadth-seg breadth-adv")} style={{ width: pct(advances) }} />
        <span className={css(styles, "breadth-seg breadth-dec")} style={{ width: pct(declines) }} />
        <span className={css(styles, "breadth-seg breadth-unch")} style={{ width: pct(unchanged) }} />
      </div>
      <div className={css(styles, "breadth-legend")}>
        <span><i className={css(styles, "dot dot-adv")} aria-hidden="true" />Advances <b className={css(styles, "numeric")}>{formatIndianNumber(advances)}</b></span>
        <span><i className={css(styles, "dot dot-dec")} aria-hidden="true" />Declines <b className={css(styles, "numeric")}>{formatIndianNumber(declines)}</b></span>
        <span><i className={css(styles, "dot dot-unch")} aria-hidden="true" />Unchanged <b className={css(styles, "numeric")}>{formatIndianNumber(unchanged)}</b></span>
      </div>
    </div>
  );
}
