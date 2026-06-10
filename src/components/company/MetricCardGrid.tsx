import { css } from "@/lib/css-module";
import styles from "./company.module.css";

export type MetricCardItem = {
  badge?: {
    label: string;
    tone: "estimated" | "unavailable";
  };
  detail?: string;
  label: string;
  value: string;
  valueTone?: string;
};

export function MetricCardGrid({ className, items }: { className?: string; items: MetricCardItem[] }) {
  return (
    <div className={css(styles, "grid metric-grid", className)}>
      {items.map(({ badge, detail, label, value, valueTone }) => (
        <div className={css(styles, "metric-card")} key={label}>
          <div className={css(styles, "metric-label-row")}>
            <div className={css(styles, "metric-label")}>{label}</div>
            {badge ? (
              <span className={css(styles, "metric-badge", `metric-badge-${badge.tone}`)}>
                {badge.label}
              </span>
            ) : null}
          </div>
          <div className={css(styles, "metric-value", valueTone)}>{value}</div>
          {detail ? <div className={css(styles, "metric-detail")}>{detail}</div> : null}
        </div>
      ))}
    </div>
  );
}
