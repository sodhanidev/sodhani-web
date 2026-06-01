"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChartCandlestick } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company/company.module.css";

import { formatIndianNumber } from "@/lib/data/format";
import type { PricePoint } from "@/lib/data/types";

type RangeKey = "1D" | "1W" | "1M" | "1Y" | "5Y" | "MAX";
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
  { key: "MAX", label: "Max" }
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

function formatTooltipDate(date: string) {
  const [year, month, day] = date.split("-");
  const monthIndex = Number(month) - 1;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (!year || !day || !months[monthIndex]) {
    return date;
  }

  return `${Number(day)} ${months[monthIndex]} '${year.slice(-2)} · 15:30 IST`;
}

export function StockChart({ advancedHref, id, points }: { advancedHref?: string; id?: string; points: PricePoint[] }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [range, setRange] = useState<RangeKey>("1Y");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPointerY, setHoverPointerY] = useState<number | null>(null);
  const [chartSize, setChartSize] = useState({ width: 1280, height: 320 });

  useEffect(() => {
    const node = frameRef.current;
    if (!node) {
      return;
    }

    const syncSize = () => {
      const rect = node.getBoundingClientRect();
      const nextSize = {
        width: Math.max(320, Math.round(rect.width)),
        height: Math.max(220, Math.round(rect.height))
      };
      setChartSize((current) =>
        current.width === nextSize.width && current.height === nextSize.height ? current : nextSize
      );
    };

    syncSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncSize);
      return () => window.removeEventListener("resize", syncSize);
    }

    const observer = new ResizeObserver(syncSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const visible = useMemo(() => filterRange(points, range), [points, range]);
  if (!visible.length) {
    return (
      <section className={css(styles, `chart-surface${id ? " section-anchor" : ""}`)} id={id}>
        <div className={css(styles, "empty-state")}>No price data available</div>
      </section>
    );
  }

  const closes = visible.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const high = Math.max(...visible.map((point) => point.high));
  const low = Math.min(...visible.map((point) => point.low));
  const { width, height } = chartSize;
  const leftPad = 4;
  const topPad = 14;
  const bottomPad = 26;
  const rightPad = width < 620 ? 54 : 76;
  const span = Math.max(1, max - min);
  const positive = visible.length > 1 && visible[visible.length - 1].close >= visible[0].close;
  const stroke = positive ? chartColors.positiveLine : chartColors.negativeLine;
  const latest = visible[visible.length - 1];
  const rangeChange = latest ? latest.close - visible[0].close : 0;
  const rangePct = visible[0] ? (rangeChange / visible[0].close) * 100 : 0;

  const coords = visible.map((point, index) => {
    const x =
      visible.length <= 1 ? width / 2 : leftPad + (index / (visible.length - 1)) * (width - leftPad - rightPad);
    const y = height - bottomPad - ((point.close - min) / span) * (height - topPad - bottomPad);
    return { x, y, point };
  });
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount }, (_, index) => {
    const value = min + (span / (yTickCount - 1)) * index;
    const y = height - bottomPad - ((value - min) / span) * (height - topPad - bottomPad);
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
      : `${linePath} L ${coords[coords.length - 1].x} ${height - bottomPad} L ${coords[0].x} ${height - bottomPad} Z`;
  const hover = hoverIndex === null ? null : coords[hoverIndex];
  const tooltipY = hover ? Math.min(height - bottomPad - 34, Math.max(topPad + 34, hoverPointerY ?? hover.y)) : 0;
  const hoverSide = hover && hover.x > width - rightPad - 150 ? "left" : "right";

  return (
    <section className={css(styles, `chart-surface${id ? " section-anchor" : ""}`)} id={id}>
      <div className={css(styles, "chart-meta-row")}>
        <div className={css(styles, "chart-stats")} aria-label="Chart summary">
          <div>
            <span>High</span>
            <strong className={css(styles, "numeric")}>₹{formatIndianNumber(high, { dp: 2 })}</strong>
          </div>
          <div>
            <span>Low</span>
            <strong className={css(styles, "numeric")}>₹{formatIndianNumber(low, { dp: 2 })}</strong>
          </div>
          <div>
            <span>Returns</span>
            <strong className={css(styles, `numeric ${rangePct >= 0 ? "up" : "down"}`)}>
              {rangePct >= 0 ? "+" : ""}
              {formatIndianNumber(rangePct, { dp: 2 })}%
            </strong>
          </div>
        </div>
        <div className={css(styles, "chart-actions")}>
          <div className={css(styles, "range-toggle chart-ranges")} aria-label="Chart range">
            {ranges.map((candidate) => (
              <button
                aria-pressed={candidate.key === range}
                className={css(styles, candidate.key === range ? "active" : "")}
                key={candidate.key}
                type="button"
                onClick={() => {
                  setRange(candidate.key);
                  setHoverIndex(null);
                  setHoverPointerY(null);
                }}
              >
                {candidate.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={css(styles, "chart-body")}>
        <div
          ref={frameRef}
          className={css(styles, "chart-frame")}
          onMouseLeave={() => {
            setHoverIndex(null);
            setHoverPointerY(null);
          }}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const chartX = ((event.clientX - rect.left) / rect.width) * width;
            const chartY = ((event.clientY - rect.top) / rect.height) * height;
            const plotRight = width - rightPad;

            if (chartX < leftPad || chartX > plotRight) {
              setHoverIndex(null);
              setHoverPointerY(null);
              return;
            }

            const ratio = (chartX - leftPad) / (width - leftPad - rightPad);
            const nextIndex = Math.round(ratio * (visible.length - 1));
            setHoverIndex(Math.max(0, Math.min(visible.length - 1, nextIndex)));
            setHoverPointerY(Math.min(height - bottomPad, Math.max(topPad, chartY)));
          }}
        >
          {coords.length <= 1 && visible[0] ? (
            <div className={css(styles, "panel-pad")}>
              <div className={css(styles, "eyebrow")}>{visible[0].date}</div>
              <div className={css(styles, "price-value")}>{formatIndianNumber(visible[0].close, { dp: 2 })}</div>
              <p className={css(styles, "muted numeric")}>Vol {formatIndianNumber(visible[0].volume)}</p>
            </div>
          ) : (
            <>
              <svg preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Close price chart">
                <defs>
                  <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity="0.14" />
                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {yTicks.map((tick, index) => (
                  <g key={tick.value}>
                    {index > 0 && index < yTicks.length - 1 ? (
                      <line x1={leftPad} x2={width - rightPad} y1={tick.y} y2={tick.y} stroke={chartColors.gridLine} />
                    ) : null}
                    <text x={width - rightPad + 14} y={tick.y + 4} fill={chartColors.axisText} fontSize="11">
                      {formatIndianNumber(tick.value, { dp: 2 })}
                    </text>
                  </g>
                ))}
                {xTickIndexes.map((index) => {
                  const coord = coords[index];
                  if (!coord) {
                    return null;
                  }
                  const isFirst = index === 0;
                  const isLast = index === visible.length - 1;
                  return (
                    <text
                      fill={chartColors.axisText}
                      fontSize="11"
                      key={coord.point.date}
                      textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                      x={coord.x}
                      y={height - 5}
                    >
                      {coord.point.date.slice(5)}
                    </text>
                  );
                })}
                <path d={areaPath} fill="url(#chartFill)" />
                <path d={linePath} fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="2.1" />
                {hover ? (
                  <>
                    <line
                      x1={leftPad}
                      x2={width - rightPad}
                      y1={hover.y}
                      y2={hover.y}
                      stroke={chartColors.hoverLine}
                      strokeDasharray="1 5"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={hover.x}
                      x2={hover.x}
                      y1={topPad}
                      y2={height - bottomPad}
                      stroke={chartColors.hoverLine}
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle cx={hover.x} cy={hover.y} fill={stroke} r="4" />
                  </>
                ) : null}
              </svg>
              {hover ? (
                <div
                  className={css(styles, "chart-tooltip")}
                  data-side={hoverSide}
                  style={{ left: `${(hover.x / width) * 100}%`, top: `${(tooltipY / height) * 100}%` }}
                >
                  <div className={css(styles, "chart-tooltip-price")}>₹{formatIndianNumber(hover.point.close, { dp: 2 })}</div>
                  <div className={css(styles, "chart-tooltip-meta")}>{formatTooltipDate(hover.point.date)}</div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      {advancedHref ? (
        <div className={css(styles, "chart-footer-actions")}>
          <Link className={css(styles, "chart-advanced-link")} href={advancedHref}>
            <ChartCandlestick size={15} aria-hidden="true" />
            Advanced
          </Link>
        </div>
      ) : null}
      <div className={css(styles, "sr-only")}>
        <table>
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
      </div>
    </section>
  );
}
