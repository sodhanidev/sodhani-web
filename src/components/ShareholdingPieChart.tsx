"use client";

import { useMemo, useState } from "react";

import type { FinancialTable } from "@/lib/data/types";

type Slice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type ChartSlice = Slice & {
  dash: number;
  offset: number;
};

type TooltipPosition = {
  x: number;
  y: number;
};

const holderColors: Record<string, string> = {
  promoters: "var(--holder-promoters)",
  fiis: "var(--holder-fiis)",
  diis: "var(--holder-diis)",
  government: "var(--holder-government)",
  public: "var(--holder-public)"
};

function parsePercent(value: string): number | null {
  const parsed = Number(value.replace(/[%\s,]/gu, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function holderKey(label: string) {
  return label.toLowerCase().replace(/[^a-z]/gu, "");
}

function shortHolderLabel(label: string) {
  const key = holderKey(label);
  if (key.includes("fii") || key.includes("foreign")) {
    return "FIIs";
  }
  if (key.includes("dii") || key.includes("domestic")) {
    return "DIIs";
  }
  return label;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function getShareholdingSlices(table: FinancialTable): { period: string; slices: Slice[] } {
  const period = table.periods.at(-1) ?? "";
  if (!period) {
    return { period, slices: [] };
  }

  const slices = table.rows
    .map((row) => {
      const key = holderKey(row.label);
      if (key.includes("shareholder")) {
        return undefined;
      }

      const value = parsePercent(row.values[period] ?? "");
      if (value === null || value <= 0) {
        return undefined;
      }

      const colorKey = Object.keys(holderColors).find((candidate) => key.includes(candidate));

      return {
        key,
        label: shortHolderLabel(row.label),
        value,
        color: colorKey ? holderColors[colorKey] : "var(--holder-other)"
      };
    })
    .filter((slice): slice is Slice => Boolean(slice))
    .sort((a, b) => b.value - a.value);

  return { period, slices };
}

export function ShareholdingPieChart({ table }: { table: FinancialTable }) {
  const { period, slices } = useMemo(() => getShareholdingSlices(table), [table]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipPosition>({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (!period || !slices.length || total <= 0) {
    return <div className="empty-state">No shareholding chart data available</div>;
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const gap = slices.length > 1 ? 1.8 : 0;
  const usable = circumference - gap * slices.length;
  const chartSlices: ChartSlice[] = slices.map((slice, index) => {
    const dash = (slice.value / total) * usable;
    const previous = slices
      .slice(0, index)
      .reduce((sum, previousSlice) => sum + (previousSlice.value / total) * usable + gap, 0);

    return {
      ...slice,
      dash,
      offset: -previous
    };
  });
  const activeSlice = activeIndex === null ? null : chartSlices[activeIndex] ?? null;

  function activate(index: number, nextShowTooltip = false) {
    setActiveIndex(index);
    setShowTooltip(nextShowTooltip);
  }

  function focusSlice(index: number) {
    activate(index, true);
    setTooltip({ x: 120, y: 34 });
  }

  function clearActive() {
    setActiveIndex(null);
    setShowTooltip(false);
  }

  function moveTooltip(event: React.PointerEvent<SVGCircleElement | HTMLButtonElement>) {
    const bounds = event.currentTarget.closest(".shareholding-donut-wrap")?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    setTooltip({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    });
    setShowTooltip(true);
  }

  return (
    <div className="shareholding-chart" aria-label={`Shareholding pattern for ${period}`}>
      <div className="shareholding-visual">
        <div className="shareholding-donut-wrap" onPointerLeave={clearActive}>
          <svg className="shareholding-donut" viewBox="0 0 120 120" role="img">
            <title>{`Shareholding pattern for ${period}`}</title>
            <circle className="shareholding-donut-track" cx="60" cy="60" r={radius} />
            {chartSlices.map((slice, index) => {
              const isActive = activeIndex === index;
              const isMuted = activeIndex !== null && !isActive;

              return (
                <circle
                  aria-label={`${slice.label} ${formatPercent(slice.value)}`}
                  className={`shareholding-donut-slice${isActive ? " is-active" : ""}${isMuted ? " is-muted" : ""}`}
                  cx="60"
                  cy="60"
                  key={slice.label}
                  r={radius}
                  role="listitem"
                  tabIndex={0}
                  onBlur={clearActive}
                  onFocus={() => focusSlice(index)}
                  onPointerEnter={(event) => {
                    activate(index, true);
                    moveTooltip(event);
                  }}
                  onPointerMove={moveTooltip}
                  style={{
                    animationDelay: `${index * 70}ms`,
                    stroke: slice.color,
                    strokeDasharray: `${slice.dash} ${circumference - slice.dash}`,
                    strokeDashoffset: slice.offset
                  }}
                />
              );
            })}
          </svg>
          {activeSlice && showTooltip ? (
            <div
              className="shareholding-tooltip"
              style={{
                left: tooltip.x,
                top: tooltip.y
              }}
            >
              <span>{activeSlice.label}</span>
              <strong className="numeric">{formatPercent(activeSlice.value)}</strong>
              <small>{period}</small>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shareholding-legend" role="list">
        {chartSlices.map((slice, index) => (
          <button
            className="shareholding-legend-row"
            data-active={activeIndex === index ? "true" : undefined}
            key={slice.label}
            role="listitem"
            type="button"
            onBlur={clearActive}
            onFocus={() => activate(index)}
            onPointerEnter={() => activate(index)}
            onPointerLeave={clearActive}
          >
            <span className="shareholding-swatch" style={{ background: slice.color }} />
            <span className="shareholding-legend-main">
              <span className="shareholding-legend-name">{slice.label}</span>
              <span className="shareholding-legend-meter" aria-hidden="true">
                <span style={{ background: slice.color, width: `${slice.value}%` }} />
              </span>
            </span>
            <strong className="numeric">{formatPercent(slice.value)}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
