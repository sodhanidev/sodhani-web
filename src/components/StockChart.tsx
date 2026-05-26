"use client";

import { Badge } from "lucide-react";
import { useMemo, useState } from "react";

import { formatIndianNumber } from "@/lib/data/format";
import type { PricePoint, Stock } from "@/lib/data/types";

type RangeKey = "1D" | "1W" | "1M" | "1Y" | "5Y" | "MAX" | "SIP";
const chartColors = {
  positiveLine: "var(--chart-line-positive, var(--up))",
  negativeLine: "var(--chart-line-negative, var(--down))",
  gridLine: "var(--chart-grid-line, var(--line))",
  axisText: "var(--chart-axis-text, var(--ink))",
  hoverLine: "var(--chart-hover-line, var(--muted))"
} as const;

const ranges: { key: RangeKey; label: string }[] = [
  { key: "1D", label: "1D" },
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
  { key: "1Y", label: "1Y" },
  { key: "5Y", label: "5Y" },
  { key: "MAX", label: "Max" },
  { key: "SIP", label: "SIP" }
];

function filterRange(points: PricePoint[], range: RangeKey): PricePoint[] {
  if (range === "1D") {
    return points.slice(-2);
  }
  if (range === "1W") {
    return points.slice(-5);
  }
  if (range === "1M") {
    return points.slice(-22);
  }
  if (range === "1Y") {
    return points.slice(-252);
  }
  if (range === "5Y") {
    return points.slice(-1260);
  }
  return points;
}

export function StockChart({ points, stock }: { points: PricePoint[]; stock: Stock }) {
  const [range, setRange] = useState<RangeKey>("1W");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const visible = useMemo(() => filterRange(points, range), [points, range]);
  if (!visible.length) {
    return (
      <section className="chart-surface">
        <div className="chart-topbar">
          <h2>Price chart</h2>
        </div>
        <div className="empty-state">No price data available</div>
      </section>
    );
  }

  const closes = visible.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const high = Math.max(...visible.map((point) => point.high));
  const low = Math.min(...visible.map((point) => point.low));
  const width = 900;
  const height = 360;
  const pad = 34;
  const rightPad = 82;
  const span = Math.max(1, max - min);
  const positive = visible.length > 1 && visible[visible.length - 1].close >= visible[0].close;
  const stroke = positive ? chartColors.positiveLine : chartColors.negativeLine;
  const latest = visible[visible.length - 1];
  const rangeChange = latest ? latest.close - visible[0].close : 0;
  const rangePct = visible[0] ? (rangeChange / visible[0].close) * 100 : 0;

  const coords = visible.map((point, index) => {
    const x = visible.length <= 1 ? width / 2 : pad + (index / (visible.length - 1)) * (width - pad - rightPad);
    const y = height - pad - ((point.close - min) / span) * (height - pad * 2);
    return { x, y, point };
  });
  const yTicks = Array.from({ length: 6 }, (_, index) => {
    const value = min + (span / 5) * index;
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return { value, y };
  }).reverse();
  const xTickIndexes = Array.from(new Set([0, Math.floor(visible.length * 0.25), Math.floor(visible.length * 0.5), Math.floor(visible.length * 0.75), visible.length - 1]));

  const linePath =
    coords.length <= 1
      ? ""
      : coords.map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`).join(" ");
  const areaPath =
    coords.length <= 1
      ? ""
      : `${linePath} L ${coords[coords.length - 1].x} ${height - pad} L ${coords[0].x} ${height - pad} Z`;
  const hover = hoverIndex === null ? null : coords[hoverIndex];
  const hoverSide = hover
    ? hover.x > width - rightPad - 130
      ? "left"
      : hover.x < pad + 130
        ? "right"
        : "center"
    : "center";

  return (
    <section className="chart-surface">
      <div className="chart-topbar">
        <div className="chart-titleline">
          <span className="chart-logo">{stock.ticker.slice(0, 1)}</span>
          <strong>{stock.ticker}</strong>
          <span className="chart-subtitle">Price history</span>
        </div>
        {stock.sourceUrl ? (
          <a className="supercharts-link" href={stock.sourceUrl} rel="noopener noreferrer" target="_blank">
            <Badge size={21} aria-hidden="true" />
            See on Supercharts
          </a>
        ) : null}
      </div>
      <div className="chart-meta-row">
        <div className="chart-stats" aria-label="Chart summary">
          <div>
            <span>High</span>
            <strong className="numeric">₹{formatIndianNumber(high, { dp: 2 })}</strong>
          </div>
          <div>
            <span>Low</span>
            <strong className="numeric">₹{formatIndianNumber(low, { dp: 2 })}</strong>
          </div>
          <div>
            <span>Returns</span>
            <strong className={`numeric ${rangePct >= 0 ? "up" : "down"}`}>
              {rangePct >= 0 ? "+" : ""}
              {formatIndianNumber(rangePct, { dp: 2 })}%
            </strong>
          </div>
        </div>
        <div className="range-toggle chart-ranges" aria-label="Chart range">
          {ranges.map((candidate) => (
            <button
              className={candidate.key === range ? "active" : ""}
              key={candidate.key}
              type="button"
              onClick={() => {
                setRange(candidate.key);
                setHoverIndex(null);
              }}
            >
              {candidate.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-body">
        <div
          className="chart-frame"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const chartX = ((event.clientX - rect.left) / rect.width) * width;
            const ratio = (chartX - pad) / (width - pad - rightPad);
            const nextIndex = Math.round(ratio * (visible.length - 1));
            setHoverIndex(Math.max(0, Math.min(visible.length - 1, nextIndex)));
          }}
        >
          {coords.length <= 1 && visible[0] ? (
            <div className="panel-pad">
              <div className="eyebrow">{visible[0].date}</div>
              <div className="price-value">{formatIndianNumber(visible[0].close, { dp: 2 })}</div>
              <p className="muted numeric">Vol {formatIndianNumber(visible[0].volume)}</p>
            </div>
          ) : (
            <>
              <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Close price chart">
                <defs>
                  <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity="0.14" />
                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {yTicks.map((tick) => (
                  <g key={tick.value}>
                    <line x1={pad} x2={width - rightPad} y1={tick.y} y2={tick.y} stroke={chartColors.gridLine} />
                    <text x={width - rightPad + 16} y={tick.y + 5} fill={chartColors.axisText} fontSize="14">
                      {formatIndianNumber(tick.value, { dp: 2 })}
                    </text>
                  </g>
                ))}
                {xTickIndexes.map((index) => {
                  const coord = coords[index];
                  if (!coord) {
                    return null;
                  }
                  return (
                    <text fill={chartColors.axisText} fontSize="13" key={coord.point.date} textAnchor="middle" x={coord.x} y={height - 6}>
                      {coord.point.date.slice(5)}
                    </text>
                  );
                })}
                <path d={areaPath} fill="url(#chartFill)" />
                <path d={linePath} fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="2.4" />
                {hover ? (
                  <>
                    <line
                      x1={hover.x}
                      x2={hover.x}
                      y1={pad}
                      y2={height - pad}
                      stroke={chartColors.hoverLine}
                      strokeDasharray="3 3"
                      strokeWidth="1.4"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle cx={hover.x} cy={hover.y} fill={stroke} r="5" />
                  </>
                ) : null}
              </svg>
              {hover ? (
                <div
                  className="chart-tooltip"
                  data-side={hoverSide}
                  style={{ left: `${(hover.x / width) * 100}%`, top: hover.y }}
                >
                  <div>₹ {formatIndianNumber(hover.point.close, { dp: 2 })}</div>
                  <div>{hover.point.date}</div>
                  <div className="chart-tooltip-grid">
                    <span>O</span>
                    <span>{formatIndianNumber(hover.point.open, { dp: 2 })}</span>
                    <span>H</span>
                    <span>{formatIndianNumber(hover.point.high, { dp: 2 })}</span>
                    <span>L</span>
                    <span>{formatIndianNumber(hover.point.low, { dp: 2 })}</span>
                    <span>V</span>
                    <span>{formatIndianNumber(hover.point.volume)}</span>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <table className="sr-only">
        <caption>Close prices</caption>
        <tbody>
          {visible.map((point) => (
            <tr key={point.date}>
              <th>{point.date}</th>
              <td>{point.close}</td>
              <td>{point.volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
