"use client";

import { useState } from "react";

import { css } from "@/lib/css-module";
import styles from "./company.module.css";
import { InfoTooltip } from "./InfoTooltip";
import { MetricCardGrid, type MetricCardItem } from "./MetricCardGrid";
import { ScToggle, type ScMode } from "./ScToggle";

const SC_TOOLTIP =
  "Standalone covers the parent company alone. Consolidated includes its subsidiaries — the standard view for valuation.";

// Key Metrics panel with an optional Standalone/Consolidated toggle. Both metric
// arrays are pre-built on the server; this client wrapper just switches between
// them. The toggle only renders when consolidated metrics are supplied.
export function KeyMetricsSection({
  standalone,
  consolidated
}: {
  standalone: MetricCardItem[];
  consolidated?: MetricCardItem[];
}) {
  const [mode, setMode] = useState<ScMode>("standalone");
  const items = mode === "consolidated" && consolidated ? consolidated : standalone;

  return (
    <section className={css(styles, "panel section-anchor")} id="key-metrics">
      <div className={css(styles, "section-title-row sc-title-row")}>
        <h2>Key Metrics</h2>
        {consolidated ? (
          <div className={css(styles, "sc-toggle-row")}>
            <ScToggle value={mode} onChange={setMode} ariaLabel="Key metrics standalone or consolidated" />
            <InfoTooltip>{SC_TOOLTIP}</InfoTooltip>
          </div>
        ) : null}
      </div>
      <MetricCardGrid className="panel-pad" items={items} />
    </section>
  );
}
