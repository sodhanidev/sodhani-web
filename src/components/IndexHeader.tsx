import { css } from "@/lib/css-module";
import styles from "./indices.module.css";
import { formatIndianNumber } from "@/lib/data/format";
import type { MarketIndex } from "@/lib/data/indices-nse";
import { SPARK_H, SPARK_W, sparkPoints } from "@/lib/data/spark";

function signed(value: number | null, dp: number) {
  if (value === null || !Number.isFinite(value)) return "-";
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${formatIndianNumber(Math.abs(value), { dp })}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={css(styles, "stat")}>
      <span className={css(styles, "stat-label")}>{label}</span>
      <span className={css(styles, "numeric stat-val")}>{value}</span>
    </div>
  );
}

// Detail-page header: label, big value, signed change, sparkline and the
// open / day-range / 52W-range stat row.
export function IndexHeader({ index }: { index: MarketIndex }) {
  const dir = (index.changePct ?? 0) >= 0 ? "up" : "down";
  const prevClose =
    index.value !== null && index.changeVal !== null ? index.value - index.changeVal : null;

  return (
    <header className={css(styles, "section")}>
      <div className={css(styles, "eyebrow")}>{index.kind === "broad" ? "Broad market" : index.kind === "sector" ? "Sector" : "Thematic"} index</div>
      <h1>{index.label}</h1>
      <div className={css(styles, "head-top")}>
        <div className={css(styles, "head-value-block")}>
          <span className={css(styles, "numeric head-value")}>{formatIndianNumber(index.value, { dp: 2 })}</span>
          <span className={css(styles, `numeric head-chg ${dir}`)}>
            <span aria-hidden="true">{dir === "up" ? "▲" : "▼"}</span>
            {signed(index.changeVal, 2)}
            <span>{signed(index.changePct, 2)}%</span>
          </span>
        </div>
        {index.spark.length > 1 ? (
          <svg
            className={css(styles, `head-spark ${dir}`)}
            viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline points={sparkPoints(index.spark)} fill="none" strokeWidth={1.5} />
          </svg>
        ) : null}
      </div>
      <div className={css(styles, "stat-row")}>
        <Stat label="Open" value={formatIndianNumber(index.open, { dp: 2 })} />
        <Stat label="Prev. Close" value={formatIndianNumber(prevClose, { dp: 2 })} />
        <Stat label="Day High" value={formatIndianNumber(index.dayHigh, { dp: 2 })} />
        <Stat label="Day Low" value={formatIndianNumber(index.dayLow, { dp: 2 })} />
        <Stat label="52W High / Low" value={`${formatIndianNumber(index.yearHigh, { dp: 2 })} / ${formatIndianNumber(index.yearLow, { dp: 2 })}`} />
      </div>
    </header>
  );
}
