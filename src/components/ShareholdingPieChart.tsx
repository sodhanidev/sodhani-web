import type { FinancialTable } from "@/lib/data/types";

type Slice = {
  label: string;
  value: number;
  color: string;
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
  const { period, slices } = getShareholdingSlices(table);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (!period || !slices.length || total <= 0) {
    return <div className="empty-state">No shareholding chart data available</div>;
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const gap = slices.length > 1 ? 1.4 : 0;
  const usable = circumference - gap * slices.length;
  const chartSlices = slices.map((slice, index) => {
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

  return (
    <div className="shareholding-chart" aria-label={`Shareholding pattern for ${period}`}>
      <div className="shareholding-donut-wrap">
        <svg className="shareholding-donut" viewBox="0 0 120 120" role="img">
          <title>Shareholding pattern for {period}</title>
          <circle className="shareholding-donut-track" cx="60" cy="60" r={radius} />
          {chartSlices.map((slice) => (
            <circle
              className="shareholding-donut-slice"
              cx="60"
              cy="60"
              key={slice.label}
              r={radius}
              style={{
                stroke: slice.color,
                strokeDasharray: `${slice.dash} ${circumference - slice.dash}`,
                strokeDashoffset: slice.offset
              }}
            />
          ))}
        </svg>
        <div className="shareholding-donut-center">
          <span>{period}</span>
          <strong>100%</strong>
        </div>
      </div>

      <div className="shareholding-legend">
        {slices.map((slice) => (
          <div className="shareholding-legend-row" key={slice.label}>
            <span className="shareholding-swatch" style={{ background: slice.color }} />
            <span>{slice.label}</span>
            <strong className="numeric">{slice.value.toFixed(2)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
