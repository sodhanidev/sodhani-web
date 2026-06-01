"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries as LightweightCandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  createChart,
  type CandlestickData,
  type HistogramData,
  type ISeriesApi,
  type MouseEventParams,
  type Time
} from "lightweight-charts";

import { formatIndianNumber } from "@/lib/data/format";
import type { CandlestickSeries } from "@/lib/data/candlestick";
import type { PricePoint } from "@/lib/data/types";

type RangeKey = "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX";

type HoverPoint = {
  close: number;
  date: string;
  high: number;
  low: number;
  open: number;
  side: "left" | "right";
  volume: number;
  x: number;
  y: number;
};

const ranges: { key: RangeKey; label: string; days?: number }[] = [
  { key: "1M", label: "1M", days: 22 },
  { key: "3M", label: "3M", days: 66 },
  { key: "6M", label: "6M", days: 132 },
  { key: "1Y", label: "1Y", days: 252 },
  { key: "5Y", label: "5Y", days: 1260 },
  { key: "MAX", label: "Max" }
];

function filterRange(points: PricePoint[], range: RangeKey) {
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

function toCandles(points: PricePoint[]): CandlestickData<Time>[] {
  return points.map((point) => ({
    close: point.close,
    high: point.high,
    low: point.low,
    open: point.open,
    time: point.date
  }));
}

function toVolumes(points: PricePoint[]): HistogramData<Time>[] {
  return points.map((point) => ({
    color: point.close >= point.open ? "rgba(34, 197, 116, 0.24)" : "rgba(255, 82, 91, 0.24)",
    time: point.date,
    value: point.volume
  }));
}

function isCandlestickData(value: unknown): value is CandlestickData<Time> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "close" in value &&
      "high" in value &&
      "low" in value &&
      "open" in value &&
      "time" in value
  );
}

function timeToDate(time: Time) {
  if (typeof time === "string") {
    return time;
  }

  if (typeof time === "number") {
    return new Date(time * 1000).toISOString().slice(0, 10);
  }

  return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
}

export function TradingViewReference({ series }: { series: CandlestickSeries[] }) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [activeCode, setActiveCode] = useState(series[0]?.code ?? "");
  const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null);
  const [range, setRange] = useState<RangeKey>("6M");

  const activeSeries = series.find((item) => item.code === activeCode) ?? series[0];
  const visible = useMemo(() => filterRange(activeSeries?.points ?? [], range), [activeSeries, range]);
  const stats = useMemo(() => {
    const first = visible[0];
    const latest = visible.at(-1);
    const high = visible.length ? Math.max(...visible.map((point) => point.high)) : null;
    const low = visible.length ? Math.min(...visible.map((point) => point.low)) : null;
    const change = latest && first ? latest.close - first.open : 0;
    const changePct = first ? (change / first.open) * 100 : 0;

    return { change, changePct, high, latest, low };
  }, [visible]);

  useEffect(() => {
    const node = chartRef.current;
    if (!node || !activeSeries || !visible.length) {
      return;
    }

    node.replaceChildren();

    const chart = createChart(node, {
      autoSize: true,
      crosshair: {
        mode: CrosshairMode.Normal,
        horzLine: {
          color: "rgba(210, 218, 229, 0.38)",
          labelBackgroundColor: "#24262d",
          style: LineStyle.Dotted,
          width: 1
        },
        vertLine: {
          color: "rgba(210, 218, 229, 0.28)",
          labelBackgroundColor: "#24262d",
          style: LineStyle.Solid,
          width: 1
        }
      },
      grid: {
        horzLines: {
          color: "rgba(210, 218, 229, 0.08)",
          visible: true
        },
        vertLines: {
          visible: false
        }
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      },
      handleScroll: {
        horzTouchDrag: true,
        mouseWheel: true,
        pressedMouseMove: true,
        vertTouchDrag: false
      },
      layout: {
        background: { type: ColorType.Solid, color: "#050505" },
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: 11,
        textColor: "#b8c1cc"
      },
      localization: {
        priceFormatter: (price: number) => `₹${formatIndianNumber(price, { dp: 2 })}`
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          bottom: 0.25,
          top: 0.08
        }
      },
      timeScale: {
        borderColor: "transparent",
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        rightOffset: 2,
        secondsVisible: false,
        timeVisible: false
      }
    });

    const candleSeries = chart.addSeries(LightweightCandlestickSeries, {
      borderVisible: false,
      downColor: "#ff535d",
      lastValueVisible: true,
      priceLineVisible: false,
      upColor: "#22c574",
      wickDownColor: "#ff535d",
      wickUpColor: "#22c574"
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      lastValueVisible: false,
      priceFormat: { type: "volume" },
      priceLineVisible: false,
      priceScaleId: ""
    });

    candleSeries.priceScale().applyOptions({
      scaleMargins: {
        bottom: 0.25,
        top: 0.08
      }
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        bottom: 0,
        top: 0.82
      }
    });

    candleSeries.setData(toCandles(visible));
    volumeSeries.setData(toVolumes(visible));
    chart.timeScale().fitContent();

    const crosshairHandler = (param: MouseEventParams<Time>) => {
      if (!param.point || !param.time) {
        setHoverPoint(null);
        return;
      }

      const data = param.seriesData.get(candleSeries as ISeriesApi<"Candlestick", Time>);
      if (!isCandlestickData(data)) {
        setHoverPoint(null);
        return;
      }

      const date = timeToDate(data.time);
      const sourcePoint = visible.find((point) => point.date === date);

      setHoverPoint({
        close: data.close,
        date,
        high: data.high,
        low: data.low,
        open: data.open,
        side: param.point.x > node.clientWidth - 180 ? "left" : "right",
        volume: sourcePoint?.volume ?? 0,
        x: param.point.x,
        y: param.point.y
      });
    };

    chart.subscribeCrosshairMove(crosshairHandler);

    return () => {
      chart.unsubscribeCrosshairMove(crosshairHandler);
      chart.remove();
    };
  }, [activeSeries, visible]);

  if (!activeSeries) {
    return <main className="tv-reference-page">No chart data available.</main>;
  }

  const displayPoint = hoverPoint ?? stats.latest;
  const changeClass = stats.changePct >= 0 ? "is-up" : "is-down";

  return (
    <main className="tv-reference-page">
      <section className="tv-reference-header">
        <div>
          <p>TradingView reference</p>
          <h1>{activeSeries.name}</h1>
          <span>{activeSeries.code}</span>
        </div>
        <label>
          Company
          <select value={activeCode} onChange={(event) => setActiveCode(event.target.value)}>
            {series.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="tv-reference-toolbar">
        <div>
          <span>Last</span>
          <strong>₹{formatIndianNumber(displayPoint?.close, { dp: 2 })}</strong>
        </div>
        <div>
          <span>Range</span>
          <strong>
            ₹{formatIndianNumber(stats.low, { dp: 2 })} - ₹{formatIndianNumber(stats.high, { dp: 2 })}
          </strong>
        </div>
        <div>
          <span>Volume</span>
          <strong>{formatVolume(displayPoint?.volume)}</strong>
        </div>
        <div>
          <span>Move</span>
          <strong className={changeClass}>
            {stats.changePct >= 0 ? "+" : ""}
            {formatIndianNumber(stats.changePct, { dp: 2 })}%
          </strong>
        </div>
        <div className="tv-reference-ranges" aria-label="Chart range">
          {ranges.map((candidate) => (
            <button
              aria-pressed={candidate.key === range}
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
      </section>

      <section className="tv-reference-chart-shell">
        <div ref={chartRef} className="tv-reference-chart" />
        <a className="tv-reference-attribution" href="https://www.tradingview.com/" rel="noreferrer" target="_blank">
          TradingView
        </a>
        {hoverPoint ? (
          <div className={`tv-reference-tooltip ${hoverPoint.side}`} style={{ left: hoverPoint.x, top: hoverPoint.y }}>
            <strong>₹{formatIndianNumber(hoverPoint.close, { dp: 2 })}</strong>
            <span>{formatDate(hoverPoint.date)} at 15:30 IST</span>
            <dl>
              <div>
                <dt>O</dt>
                <dd>₹{formatIndianNumber(hoverPoint.open, { dp: 2 })}</dd>
              </div>
              <div>
                <dt>H</dt>
                <dd>₹{formatIndianNumber(hoverPoint.high, { dp: 2 })}</dd>
              </div>
              <div>
                <dt>L</dt>
                <dd>₹{formatIndianNumber(hoverPoint.low, { dp: 2 })}</dd>
              </div>
              <div>
                <dt>Vol</dt>
                <dd>{formatVolume(hoverPoint.volume)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </section>
    </main>
  );
}
