import Link from "next/link";
import { Activity, ArrowRight, ArrowUpRight, Rocket } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./page.module.css";

import { SiteFooter } from "@/components/SiteFooter";
import { CompanyLogoMark } from "@/components/CompanyLogoMark";
import { MarketMoversTabs, type Mover } from "@/components/MarketMoversTabs";
import { MarketBreadthPanel } from "@/components/MarketBreadthPanel";
import { RaCallsPanel } from "@/components/RaCallsPanel";
import { MarketSnapshot } from "@/components/MarketSnapshot";
import { AdvisoryCard } from "@/components/AdvisoryCard";
import { ResearchReports } from "@/components/ResearchReports";
import { RailScroller } from "@/components/RailScroller";
import { SectorHealthCards } from "@/components/SectorHealthCards";

import { getCompanies, topCompanies } from "@/lib/data/companies";
import { getIndustryData } from "@/lib/data/industry";
import {
  candlestickToolHref,
  companyHref,
  formatIndianNumber,
  formatMetric
} from "@/lib/data/format";
import type { Company } from "@/lib/data/types";

function toMover(company: Company): Mover {
  return {
    code: company.code,
    name: company.name,
    cmp: company.cmp,
    changePct: company.profitVarPct
  };
}

// Profit growth off a tiny base produces absurd figures (a company going from
// Rs 0.1Cr to Rs 100Cr profit reads as +99,900%). Rank movers only among
// companies with a real profit base and a believable variance band.
const MOVER_MIN_PROFIT_CR = 100;
const MOVER_MAX_ABS_PCT = 150;

function moverPool(companies: Company[]): Company[] {
  return companies.filter(
    (company) =>
      typeof company.npQtrCr === "number" &&
      (company.npQtrCr ?? 0) >= MOVER_MIN_PROFIT_CR &&
      typeof company.profitVarPct === "number" &&
      Math.abs(company.profitVarPct ?? 0) <= MOVER_MAX_ABS_PCT
  );
}

function topGainers(companies: Company[], limit: number): Company[] {
  return moverPool(companies)
    .filter((company) => (company.profitVarPct ?? 0) > 0)
    .sort((a, b) => (b.profitVarPct ?? 0) - (a.profitVarPct ?? 0))
    .slice(0, limit);
}

function topLosers(companies: Company[], limit: number): Company[] {
  return moverPool(companies)
    .filter((company) => (company.profitVarPct ?? 0) < 0)
    .sort((a, b) => (a.profitVarPct ?? 0) - (b.profitVarPct ?? 0))
    .slice(0, limit);
}

export default function HomePage() {
  // getCompanies() also attaches companyCount onto the industry nodes, so call it first.
  const companies = getCompanies();
  const { roots } = getIndustryData();

  const featured = topCompanies(companies, "marketCapCr", 8);
  const gainers = topGainers(companies, 10).map(toMover);
  const losers = topLosers(companies, 10).map(toMover);

  const sectors = [...roots]
    .filter((node) => node.companyCount > 0)
    .sort((a, b) => b.companyCount - a.companyCount)
    .slice(0, 6);

  return (
    <main className={css(styles, "landing-page")}>
      {/* Hero */}
      <section className={css(styles, "dash-hero")}>
        <div className={css(styles, "dash-hero-inner")}>
          <h1 className={css(styles, "dash-hero-title")}>
            Research every listed
            <br />
            Indian company in one place
          </h1>
          <p className={css(styles, "dash-hero-sub")}>
            Screen, compare, and dig into financials, ratios, and shareholding, all from fast,
            static data.
          </p>
          <div className={css(styles, "dash-hero-cta")}>
            <Link className={css(styles, "dash-cta-primary")} href="/market/">
              Explore the market
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className={css(styles, "dash-cta-secondary")} href={candlestickToolHref()}>
              Candlestick tool
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Market snapshot: indices, commodities, currency */}
      <MarketSnapshot />

      {/* Explore & analyze stocks rail */}
      <section className={css(styles, "dash-section")}>
        <div className={css(styles, "dash-section-head")}>
          <h2 className={css(styles, "dash-section-title")}>
            <Rocket size={18} aria-hidden="true" />
            Explore &amp; analyze stocks
          </h2>
          <Link className={css(styles, "dash-view-all")} href="/market/">
            View all
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <RailScroller>
          {featured.map((company) => (
            <Link
              key={company.code}
              href={companyHref(company.code)}
              className={css(styles, "dash-stock-card")}
            >
              <CompanyLogoMark code={company.code} name={company.name} size="md" />
              <span className={css(styles, "dash-stock-name")}>{company.name}</span>
              <span className={css(styles, "numeric dash-stock-price")}>
                {formatMetric(company.cmp, "currency")}
              </span>
              <span className={css(styles, "dash-stock-meta")}>
                {formatMetric(company.marketCapCr, "crore")} m-cap
              </span>
              <span className={css(styles, "dash-stock-link")}>
                Analyze
                <ArrowRight size={13} aria-hidden="true" />
              </span>
            </Link>
          ))}

          <Link className={css(styles, "dash-promo-card")} href="/market/">
            <h3>Browse the full screener</h3>
            <p>{formatIndianNumber(companies.length)} companies across every sector and industry.</p>
            <span className={css(styles, "dash-promo-action")}>
              Open market browser
              <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>
        </RailScroller>
      </section>

      {/* Market today: dense asymmetric bento of live market data */}
      <section className={css(styles, "dash-section")}>
        <div className={css(styles, "dash-section-head")}>
          <h2 className={css(styles, "dash-section-title")}>
            <Activity size={18} aria-hidden="true" />
            Market today
          </h2>
          <Link className={css(styles, "dash-view-all")} href="/market/">
            Full market
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <div className={css(styles, "bento")}>
          <div className={css(styles, "bento-tile bento-breadth")}>
            <MarketBreadthPanel />
          </div>

          <div className={css(styles, "bento-tile bento-movers")}>
            <MarketMoversTabs gainers={gainers} losers={losers} />
          </div>

          <div className={css(styles, "bento-tile bento-racalls")}>
            <RaCallsPanel />
          </div>

          <div className={css(styles, "bento-tile bento-advisory")}>
            <AdvisoryCard />
          </div>
        </div>
      </section>

      {/* Brokerage / research reports */}
      <ResearchReports />

      {/* Browse by sector: per-sector health stats */}
      <SectorHealthCards sectors={sectors} />

      <SiteFooter />
    </main>
  );
}
