import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { getCompaniesForNode } from "@/lib/data/companies";
import { formatIndianNumber, marketHref } from "@/lib/data/format";
import type { Company, IndustryNode } from "@/lib/data/types";
import { SectorGlyph } from "@/components/SectorGlyph";

type SectorHealth = {
  node: IndustryNode;
  totalMcapCr: number;
  pe: number | undefined;
  profitGrowthPct: number | undefined;
  advancing: number;
  declining: number;
  unchanged: number;
};

// Market-cap-weighted sector P/E. Mirrors calculatePeForNode (private to
// company-template) so we don't re-export an internal helper.
function weightedPe(constituents: Company[]): number | undefined {
  const valid = constituents.filter(
    (c) => typeof c.marketCapCr === "number" && c.marketCapCr > 0 && typeof c.pe === "number" && c.pe > 0
  );
  if (valid.length < 2) return undefined;
  const totalMcap = valid.reduce((sum, c) => sum + (c.marketCapCr ?? 0), 0);
  const totalEarnings = valid.reduce((sum, c) => sum + (c.marketCapCr ?? 0) / (c.pe ?? 1), 0);
  if (totalEarnings <= 0) return undefined;
  return totalMcap / totalEarnings;
}

function sectorHealth(node: IndustryNode): SectorHealth {
  const companies = getCompaniesForNode(node);

  const totalMcapCr = companies.reduce((sum, c) => sum + (c.marketCapCr ?? 0), 0);

  // Profit growth: mean quarterly profit variance across companies that report it.
  const growths = companies.map((c) => c.profitVarPct).filter((v): v is number => typeof v === "number");
  const profitGrowthPct = growths.length
    ? growths.reduce((sum, v) => sum + v, 0) / growths.length
    : undefined;

  // Profit breadth: companies advancing / declining by quarterly profit variance.
  let advancing = 0;
  let declining = 0;
  let unchanged = 0;
  for (const c of companies) {
    const v = c.profitVarPct;
    if (typeof v !== "number") continue;
    if (v > 0) advancing += 1;
    else if (v < 0) declining += 1;
    else unchanged += 1;
  }

  return {
    node,
    totalMcapCr,
    pe: weightedPe(companies),
    profitGrowthPct,
    advancing,
    declining,
    unchanged
  };
}

// ₹4.82 L Cr / ₹990K Cr — compact for the m-cap metric.
function formatCompactCrore(cr: number): string {
  if (cr >= 100000) return `₹${formatIndianNumber(cr / 100000, { dp: 2 })} L Cr`;
  if (cr >= 1000) return `₹${formatIndianNumber(cr / 1000, { dp: 0 })}K Cr`;
  return `₹${formatIndianNumber(cr, { dp: 0 })} Cr`;
}

function HealthCard({ health }: { health: SectorHealth }) {
  const { node, advancing, declining, unchanged } = health;
  const breadthTotal = advancing + declining + unchanged || 1;
  const advPct = (advancing / breadthTotal) * 100;
  const unchPct = (unchanged / breadthTotal) * 100;
  const decPct = (declining / breadthTotal) * 100;
  const advShare = Math.round((advancing / breadthTotal) * 100);
  const decShare = Math.round((declining / breadthTotal) * 100);

  const growth = health.profitGrowthPct;
  const growthDir = (growth ?? 0) >= 0 ? "up" : "down";

  return (
    <Link href={marketHref(node.path)} className={css(styles, "sector-card")}>
      <div className={css(styles, "sector-card-head")}>
        <span className={css(styles, "sector-card-icon")} aria-hidden="true">
          <SectorGlyph name={node.name} size={19} />
        </span>
        <span className={css(styles, "sector-card-headtext")}>
          <span className={css(styles, "sector-card-name")}>{node.name}</span>
          <span className={css(styles, "sector-card-count")}>
            {formatIndianNumber(node.companyCount)} companies
          </span>
        </span>
        <ArrowUpRight className={css(styles, "sector-card-go")} size={16} aria-hidden="true" />
      </div>

      <div className={css(styles, "sector-card-metrics")}>
        <span className={css(styles, "sector-card-metric")}>
          <span className={css(styles, "sector-card-metric-val")}>
            {formatCompactCrore(health.totalMcapCr)}
          </span>
          <span className={css(styles, "sector-card-metric-label")}>M-cap</span>
        </span>
        <span className={css(styles, "sector-card-metric")}>
          <span className={css(styles, "sector-card-metric-val")}>
            {health.pe === undefined ? "—" : formatIndianNumber(health.pe, { dp: 1 })}
          </span>
          <span className={css(styles, "sector-card-metric-label")}>P/E</span>
        </span>
        <span className={css(styles, "sector-card-metric")}>
          <span className={css(styles, `sector-card-metric-val ${growthDir}`)}>
            {growth === undefined
              ? "—"
              : `${growth >= 0 ? "+" : "−"}${formatIndianNumber(Math.abs(growth), { dp: 1, suffix: "%" })}`}
          </span>
          <span className={css(styles, "sector-card-metric-label")}>Profit gr.</span>
        </span>
      </div>

      <div className={css(styles, "sector-card-breadth-wrap")}>
        <div className={css(styles, "sector-card-breadth-head")}>
          <span className={css(styles, "sector-card-breadth-label")}>Profit breadth</span>
          <span className={css(styles, "sector-card-breadth-val")}>
            <span className={css(styles, "up")}>{advancing}</span>
            {" / "}
            <span className={css(styles, "down")}>{declining}</span>
          </span>
        </div>
        <div className={css(styles, "sector-card-breadth")} aria-hidden="true">
          <span className={css(styles, "sector-card-breadth-seg adv")} style={{ width: `${advPct}%` }} />
          <span className={css(styles, "sector-card-breadth-seg unch")} style={{ width: `${unchPct}%` }} />
          <span className={css(styles, "sector-card-breadth-seg dec")} style={{ width: `${decPct}%` }} />
        </div>
        <div className={css(styles, "sector-card-breadth-cap")}>
          <span>{advShare}% advancing</span>
          <span>{decShare}% declining</span>
        </div>
      </div>
    </Link>
  );
}

export function SectorHealthCards({ sectors }: { sectors: IndustryNode[] }) {
  const cards = sectors.map(sectorHealth);

  return (
    <section className={css(styles, "dash-section dash-section-flush")}>
      <div className={css(styles, "dash-section-head")}>
        <h2 className={css(styles, "dash-section-title")}>Browse by sector</h2>
        <Link className={css(styles, "dash-view-all")} href="/market/">
          All sectors
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <div className={css(styles, "sector-grid")}>
        {cards.map((health) => (
          <HealthCard key={health.node.code} health={health} />
        ))}
      </div>
    </section>
  );
}
