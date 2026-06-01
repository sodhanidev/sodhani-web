"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChartCandlestick, Search } from "lucide-react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

import { css } from "@/lib/css-module";
import { formatIndianNumber } from "@/lib/data/format";
import type { CandlestickSeries } from "@/lib/data/candlestick";
import type { PricePoint } from "@/lib/data/types";

import styles from "./company/company.module.css";

type CandleRangeKey = "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX";

type AxisPointerEvent = {
  axesInfo?: Array<{
    axisDim?: string;
    value?: number | string;
  }>;
};

type CloseLabel = {
  color: string;
  value: number;
  y: number;
};

const ranges: { key: CandleRangeKey; label: string; days?: number }[] = [
  { key: "1M", label: "1M", days: 22 },
  { key: "3M", label: "3M", days: 66 },
  { key: "6M", label: "6M", days: 132 },
  { key: "1Y", label: "1Y", days: 252 },
  { key: "5Y", label: "5Y", days: 1260 },
  { key: "MAX", label: "Max" }
];

function filterRange(points: PricePoint[], range: CandleRangeKey) {
  const config = ranges.find((candidate) => candidate.key === range);
  return config?.days ? points.slice(-config.days) : points;
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = months[Number(month) - 1];

  if (!year || !monthName || !day) {
    return date;
  }

  return `${Number(day)} ${monthName} '${year.slice(-2)}`;
}

function formatVolume(value: number | null | undefined) {
  if (!value || !Number.isFinite(value)) {
    return "-";
  }

  if (value >= 10000000) {
    return `${formatIndianNumber(value / 10000000, { dp: 2 })} Cr`;
  }

  if (value >= 100000) {
    return `${formatIndianNumber(value / 100000, { dp: 2 })} L`;
  }

  return formatIndianNumber(value);
}

function readCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function hexToRgba(color: string, alpha: number) {
  if (!color.startsWith("#") || (color.length !== 7 && color.length !== 4)) {
    return color;
  }

  const hex =
    color.length === 4
      ? color
          .slice(1)
          .split("")
          .map((character) => character + character)
          .join("")
      : color.slice(1);
  const value = Number.parseInt(hex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function tooltipHtml(point: PricePoint) {
  return `
    <div class="ohlc-tooltip">
      <div class="ohlc-tooltip-price">₹${formatIndianNumber(point.close, { dp: 2 })}</div>
      <div class="ohlc-tooltip-date">${formatDate(point.date)} at 15:30 IST</div>
      <div class="ohlc-tooltip-grid">
        <span>O</span><b>₹${formatIndianNumber(point.open, { dp: 2 })}</b>
        <span>H</span><b>₹${formatIndianNumber(point.high, { dp: 2 })}</b>
        <span>L</span><b>₹${formatIndianNumber(point.low, { dp: 2 })}</b>
        <span>Vol</span><b>${formatVolume(point.volume)}</b>
      </div>
    </div>
  `;
}

function resolvePointerIndex(value: number | string | undefined, points: PricePoint[]) {
  if (typeof value === "number") {
    return value >= 0 && value < points.length ? value : null;
  }

  if (typeof value === "string") {
    const index = points.findIndex((point) => point.date === value);
    return index >= 0 ? index : null;
  }

  return null;
}

function getMoveClass(value: number) {
  return value >= 0 ? "up" : "down";
}

export function CandlestickChartTool({
  backHref,
  initialCode,
  locked = false,
  series,
  subtitle,
  title = "Candlestick Chart"
}: {
  backHref?: string;
  initialCode?: string;
  locked?: boolean;
  series: CandlestickSeries[];
  subtitle?: string;
  title?: string;
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [activeCode, setActiveCode] = useState(initialCode ?? series[0]?.code ?? "");
  const [range, setRange] = useState<CandleRangeKey>("6M");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<PricePoint | null>(null);
  const [closeLabel, setCloseLabel] = useState<CloseLabel | null>(null);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeVersion((version) => version + 1));
    observer.observe(document.documentElement, { attributeFilter: ["data-theme"], attributes: true });
    return () => observer.disconnect();
  }, []);

  const activeSeries = series.find((item) => item.code === activeCode) ?? series[0];
  const visible = useMemo(() => filterRange(activeSeries?.points ?? [], range), [activeSeries, range]);
  const filteredSeries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = normalizedQuery
      ? series.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(normalizedQuery))
      : series;

    return matches.slice(0, 8);
  }, [query, series]);

  const stats = useMemo(() => {
    const latest = visible.at(-1);
    const first = visible[0];
    const high = visible.length ? Math.max(...visible.map((point) => point.high)) : null;
    const low = visible.length ? Math.min(...visible.map((point) => point.low)) : null;
    const change = latest && first ? latest.close - first.open : 0;
    const changePct = first ? (change / first.open) * 100 : 0;

    return { latest, first, high, low, change, changePct };
  }, [visible]);

  useEffect(() => {
    const node = chartRef.current;
    if (!node || !activeSeries || !visible.length) {
      return;
    }

    const background = readCssVar("--bg", "#ffffff");
    const axis = readCssVar("--chart-axis", "#111111");
    const muted = readCssVar("--chart-muted", "#6a7280");
    const hover = readCssVar("--chart-hover-line", "#aeb8c4");
    const up = "#049981";
    const down = "#f23645";
    const fontFamily = readCssVar("--font-sans", "Inter, ui-sans-serif, system-ui, sans-serif");
    const dates = visible.map((point) => point.date);
    const candleData = visible.map((point) => [point.open, point.close, point.low, point.high]);
    const latestPoint = visible.at(-1);
    const latestColor = latestPoint && latestPoint.close >= latestPoint.open ? up : down;
    const maxVolume = Math.max(1, ...visible.map((point) => point.volume));
    const volumeData = visible.map((point, index) => ({
      value: [index, point.volume],
      itemStyle: {
        color: point.close >= point.open ? hexToRgba(up, 0.28) : hexToRgba(down, 0.28)
      }
    }));

    const chart = echarts.init(node, null, { renderer: "canvas" });
    const syncCloseLabel = () => {
      if (!latestPoint) {
        setCloseLabel(null);
        return;
      }

      const high = Math.max(...visible.map((point) => point.high));
      const low = Math.min(...visible.map((point) => point.low));
      const span = Math.max(1, high - low);
      const paddedHigh = high + span * 0.06;
      const paddedLow = low - span * 0.06;
      const paddedSpan = Math.max(1, paddedHigh - paddedLow);
      const plotTop = 8;
      const plotBottom = 26;
      const plotHeight = Math.max(1, node.clientHeight - plotTop - plotBottom);
      const y = plotTop + ((paddedHigh - latestPoint.close) / paddedSpan) * plotHeight;

      if (!Number.isFinite(y)) {
        setCloseLabel(null);
        return;
      }

      setCloseLabel({
        color: latestColor,
        value: latestPoint.close,
        y: Math.min(Math.max(y, 12), node.clientHeight - 12)
      });
    };
    const option: EChartsOption = {
      animation: false,
      backgroundColor: background,
      axisPointer: {
        label: {
          show: false
        },
        snap: true
      },
      grid: [
        {
          top: 8,
          right: 78,
          bottom: 26,
          left: 0,
          containLabel: false
        }
      ],
      tooltip: {
        appendToBody: true,
        axisPointer: {
          animation: false,
          label: {
            show: false
          },
          type: "cross"
        },
        backgroundColor: "rgba(28, 28, 30, 0.94)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderRadius: 6,
        borderWidth: 1,
        confine: true,
        className: "ohlc-tooltip-shell",
        enterable: false,
        extraCssText:
          "width:160px!important;max-width:160px!important;min-width:160px!important;height:auto!important;min-height:0!important;box-shadow:0 14px 30px rgba(0,0,0,.28);padding:0!important;white-space:normal;pointer-events:none;",
        formatter: (params) => {
          const list = Array.isArray(params) ? params : [params];
          const candle = list.find((item) => item.seriesType === "candlestick");
          const index = typeof candle?.dataIndex === "number" ? candle.dataIndex : null;
          const point = index === null ? null : visible[index];
          return point ? tooltipHtml(point) : "";
        },
        position: (point, _params, _dom, _rect, size) => {
          const tooltipWidth = size.contentSize[0] || 156;
          const tooltipHeight = size.contentSize[1] || 132;
          const viewWidth = size.viewSize[0];
          const viewHeight = size.viewSize[1];
          const x = point[0] + tooltipWidth + 18 > viewWidth ? point[0] - tooltipWidth - 12 : point[0] + 12;
          const y = Math.min(Math.max(point[1] - tooltipHeight / 2, 8), Math.max(8, viewHeight - tooltipHeight - 8));

          return [x, y];
        },
        trigger: "axis",
        triggerOn: "mousemove|click|mousewheel",
        transitionDuration: 0
      },
      xAxis: [
        {
          type: "category",
          data: dates,
          boundaryGap: true,
          axisLine: { show: false },
          axisPointer: {
            label: { show: false },
            lineStyle: {
              color: hover,
              type: "solid",
              width: 1
            }
          },
          axisTick: { show: false },
          axisLabel: {
            color: muted,
            fontFamily,
            fontSize: 11,
            interval: Math.max(0, Math.floor(visible.length / 4) - 1),
            margin: 12,
            formatter: (value: string) => value.slice(5)
          },
          min: "dataMin",
          max: "dataMax",
          splitLine: { show: false }
        }
      ],
      yAxis: [
        {
          type: "value",
          axisLabel: {
            color: axis,
            fontFamily,
            fontSize: 11,
            formatter: (value: number) => `₹${formatIndianNumber(value, { dp: 2 })}`,
            margin: 14
          },
          axisLine: { show: false },
          axisPointer: {
            label: { show: false },
            lineStyle: {
              color: hover,
              type: "dotted",
              width: 1
            }
          },
          axisTick: { show: false },
          position: "right",
          scale: true,
          splitLine: { show: false },
          splitNumber: 3
        },
        {
          type: "value",
          axisLabel: { show: false },
          axisLine: { show: false },
          axisPointer: {
            label: { show: false },
            show: false
          },
          axisTick: { show: false },
          max: maxVolume / 0.18,
          min: 0,
          splitLine: { show: false }
        }
      ],
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: [0],
          filterMode: "none",
          zoomOnMouseWheel: true,
          moveOnMouseWheel: true,
          moveOnMouseMove: true
        }
      ],
      series: [
        {
          type: "candlestick",
          data: candleData,
          barMaxWidth: 64,
          barMinWidth: 2,
          barWidth: "62%",
          itemStyle: {
            color: up,
            color0: down,
            borderColor: up,
            borderColor0: down,
            borderWidth: 1
          },
          emphasis: {
            disabled: true
          },
          large: true,
          name: activeSeries.code,
          z: 3
        },
        {
          type: "bar",
          data: volumeData,
          barMaxWidth: 64,
          barMinWidth: 2,
          barWidth: "62%",
          itemStyle: {
            borderWidth: 0
          },
          name: "Volume",
          yAxisIndex: 1,
          z: 1
        }
      ],
      textStyle: {
        color: axis,
        fontFamily
      }
    };

    chart.setOption(option, true);
    requestAnimationFrame(syncCloseLabel);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
      requestAnimationFrame(syncCloseLabel);
    });
    resizeObserver.observe(node);
    chart.on("dataZoom", syncCloseLabel);

    chart.on("updateAxisPointer", (event: unknown) => {
      const pointerEvent = event as AxisPointerEvent;
      const xAxis = pointerEvent.axesInfo?.find((axisInfo) => axisInfo.axisDim === "x") ?? pointerEvent.axesInfo?.[0];
      const index = resolvePointerIndex(xAxis?.value, visible);
      setHoverPoint(index === null ? null : visible[index]);
    });
    chart.getZr().on("globalout", () => setHoverPoint(null));

    return () => {
      chart.off("dataZoom", syncCloseLabel);
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [activeSeries, range, themeVersion, visible]);

  if (!activeSeries) {
    return (
      <main className={css(styles, "candlestick-page")}>
        <section className={css(styles, "empty-state")}>No candlestick data available</section>
      </main>
    );
  }

  const displayPoint = hoverPoint ?? stats.latest;
  const rangeLabel =
    stats.low !== null && stats.high !== null
      ? `₹${formatIndianNumber(stats.low, { dp: 2 })} - ₹${formatIndianNumber(stats.high, { dp: 2 })}`
      : "-";
  const moveClass = getMoveClass(stats.changePct);
  const headerSubtitle = subtitle ?? (locked ? "" : "Search a company and inspect OHLCV data with a technical candlestick view.");

  return (
    <main className={css(styles, "candlestick-page")}>
      <header className={css(styles, `candlestick-header${locked ? " locked" : ""}`)}>
        <div className={css(styles, "candlestick-header-top")}>
          {backHref ? (
            <Link className={css(styles, "candlestick-back-link")} href={backHref}>
              <ArrowLeft size={15} aria-hidden="true" />
              Back to company
            </Link>
          ) : null}
          <p className={css(styles, "candlestick-eyebrow")}>
            <ChartCandlestick size={15} aria-hidden="true" />
            Advanced chart
          </p>
        </div>

        <div className={css(styles, "candlestick-header-title")}>
          <h1>{locked ? activeSeries.name : title}</h1>
          {locked ? (
            <span className={css(styles, "candlestick-header-code")}>{activeSeries.code}</span>
          ) : null}
          {headerSubtitle ? <p>{headerSubtitle}</p> : null}
        </div>

        {!locked ? (
          <div className={css(styles, "candlestick-header-actions searchable")}>
            <div className={css(styles, "candlestick-search")}>
              <label htmlFor="candlestick-company-search">Company</label>
              <div className={css(styles, "candlestick-search-box")}>
                <Search size={17} aria-hidden="true" />
                <input
                  id="candlestick-company-search"
                  placeholder="Search company"
                  type="search"
                  value={query}
                  onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                />
              </div>
              {searchOpen ? (
                <div className={css(styles, "candlestick-results")}>
                  {filteredSeries.length ? (
                    filteredSeries.map((item) => (
                      <button
                        className={css(styles, item.code === activeSeries.code ? "active" : "")}
                        key={item.code}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setActiveCode(item.code);
                          setQuery("");
                          setSearchOpen(false);
                          setHoverPoint(null);
                        }}
                      >
                        <span>{item.name}</span>
                        <small>{item.code}</small>
                      </button>
                    ))
                  ) : (
                    <span className={css(styles, "candlestick-no-results")}>No matches</span>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      <section className={css(styles, "candlestick-panel")}>
        <div className={css(styles, `candlestick-toolbar${locked ? " locked" : ""}`)}>
          {!locked ? (
            <div className={css(styles, "candlestick-symbol")}>
              <span>{activeSeries.code}</span>
              <strong>{activeSeries.name}</strong>
            </div>
          ) : null}
          <div className={css(styles, "candlestick-stat-row")}>
            <div>
              <span>Last</span>
              <strong className={css(styles, "numeric")}>₹{formatIndianNumber(displayPoint?.close, { dp: 2 })}</strong>
            </div>
            <div>
              <span>Range</span>
              <strong className={css(styles, "numeric")}>{rangeLabel}</strong>
            </div>
            <div>
              <span>Volume</span>
              <strong className={css(styles, "numeric")}>{formatVolume(displayPoint?.volume)}</strong>
            </div>
            <div>
              <span>Move</span>
              <strong className={css(styles, `numeric ${moveClass}`)}>
                {stats.changePct >= 0 ? "+" : ""}
                {formatIndianNumber(stats.changePct, { dp: 2 })}%
              </strong>
            </div>
          </div>
          <div className={css(styles, "range-toggle chart-ranges candlestick-ranges")} aria-label="Candlestick range">
            {ranges.map((candidate) => (
              <button
                className={css(styles, candidate.key === range ? "active" : "")}
                key={candidate.key}
                type="button"
                onClick={() => {
                  setRange(candidate.key);
                  setHoverPoint(null);
                }}
              >
                {candidate.label}
              </button>
            ))}
          </div>
        </div>

        <div className={css(styles, "candlestick-chart-shell")}>
          <div ref={chartRef} className={css(styles, "candlestick-chart-frame")} />
          {closeLabel ? (
            <div
              className={css(styles, "ohlc-close-label")}
              style={{ backgroundColor: closeLabel.color, top: closeLabel.y }}
            >
              ₹{formatIndianNumber(closeLabel.value, { dp: 2 })}
            </div>
          ) : null}
        </div>
      </section>

      <div className={css(styles, "sr-only")}>
        <table>
          <caption>{activeSeries.name} OHLC prices</caption>
          <tbody>
            {visible.map((point) => (
              <tr key={point.date}>
                <th>{point.date}</th>
                <td>{point.open}</td>
                <td>{point.high}</td>
                <td>{point.low}</td>
                <td>{point.close}</td>
                <td>{point.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
