"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

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

function longHolderLabel(label: string) {
  const key = holderKey(label);
  if (key.includes("fii") || key.includes("foreign")) {
    return "Foreign Institutions";
  }
  if (key.includes("dii") || key.includes("domestic")) {
    return "Domestic Institutions";
  }
  if (key.includes("public")) {
    return "Retail And Others";
  }
  return label;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatPeriodTab(period: string) {
  const match = /^([A-Za-z]{3})\s+(\d{4})$/u.exec(period);
  if (!match) {
    return period;
  }

  return `${match[1]} '${match[2].slice(-2)}`;
}

function getRecentPeriods(periods: string[]) {
  const looksQuarterly = periods.some((period) => !period.startsWith("Mar "));
  return periods.slice(looksQuarterly ? -12 : -3);
}

function featuredHolderRank(slice: Slice) {
  const key = holderKey(slice.label);
  if (key.includes("promoters")) {
    return 0;
  }
  if (key.includes("fii") || key.includes("foreign")) {
    return 1;
  }
  if (key.includes("public")) {
    return 2;
  }
  return 3;
}

function getShareholdingSlices(table: FinancialTable, activePeriod: string): { period: string; slices: Slice[] } {
  const period = activePeriod || table.periods.at(-1) || "";
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
    .filter((slice): slice is Slice => Boolean(slice));

  return { period, slices };
}

export function ShareholdingPieChart({ table }: { table: FinancialTable }) {
  const recentPeriods = useMemo(() => getRecentPeriods(table.periods), [table.periods]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const period = selectedPeriod && recentPeriods.includes(selectedPeriod) ? selectedPeriod : recentPeriods.at(-1) || "";
  const { slices } = useMemo(() => getShareholdingSlices(table, period), [period, table]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipPosition>({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAllHolders, setShowAllHolders] = useState(false);
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
  const tooltipSide = tooltip.x > 110 ? "left" : "right";
  const featuredSlices = slices
    .filter((slice) => featuredHolderRank(slice) < 3)
    .sort((first, second) => featuredHolderRank(first) - featuredHolderRank(second));
  const visibleSlices = showAllHolders ? slices : featuredSlices;
  const canShowMore = slices.length > featuredSlices.length;

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

  function choosePeriod(nextPeriod: string) {
    setSelectedPeriod(nextPeriod);
    clearActive();
  }

  function moveTooltip(event: React.PointerEvent<SVGCircleElement>) {
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
              className="chart-tooltip shareholding-tooltip"
              data-side={tooltipSide}
              style={{
                left: tooltip.x,
                top: tooltip.y
              }}
            >
              <div className="chart-tooltip-price numeric">{formatPercent(activeSlice.value)}</div>
              <div className="chart-tooltip-meta">
                {activeSlice.label} · {period}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="shareholding-breakdown">
        <div className="shareholding-period-tabs" role="tablist" aria-label="Shareholding periods">
          {recentPeriods.map((availablePeriod) => {
            const isActive = availablePeriod === period;

            return (
              <button
                aria-selected={isActive}
                className={isActive ? "active" : ""}
                key={availablePeriod}
                role="tab"
                type="button"
                onClick={() => choosePeriod(availablePeriod)}
              >
                {formatPeriodTab(availablePeriod)}
              </button>
            );
          })}
        </div>
        <div className="shareholding-bars">
          {visibleSlices.map((slice) => {
            const barStyle = {
              "--shareholding-value": `${Math.min(Math.max(slice.value, 0), 100)}%`
            } as CSSProperties;

            return (
              <div
                aria-label={`${longHolderLabel(slice.label)} ${formatPercent(slice.value)} in ${period}`}
                className="shareholding-bar-row"
                key={slice.key}
              >
                <span className="shareholding-bar-label">{longHolderLabel(slice.label)}</span>
                <div className="shareholding-bar-line">
                  <div className="shareholding-bar-track" aria-hidden="true">
                    <span className="shareholding-bar-fill" style={barStyle} />
                  </div>
                  <strong className="numeric">{formatPercent(slice.value)}</strong>
                </div>
              </div>
            );
          })}
        </div>
        {canShowMore ? (
          <button className="shareholding-more-button" type="button" onClick={() => setShowAllHolders(!showAllHolders)}>
            {showAllHolders ? "See Less" : "See More"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
