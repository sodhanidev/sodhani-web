import Link from "next/link";
import { ArrowRight, ArrowUpRight, BarChart3, Rocket, Trophy } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./page.module.css";

import { SiteFooter } from "@/components/SiteFooter";
import { CompanyLogoMark } from "@/components/CompanyLogoMark";
import { MarketMoversTabs, type Mover } from "@/components/MarketMoversTabs";
import { MarketOverview } from "@/components/MarketOverview";
import { RailScroller } from "@/components/RailScroller";
import { SectorIcon } from "@/components/SectorIcon";

import { getCompanies, getTopCompaniesForNode, topCompanies } from "@/lib/data/companies";
import { getIndustryData } from "@/lib/data/industry";
import { getAvailableStockCodes, getStock } from "@/lib/data/stocks";
import {
  candlestickToolHref,
  companyHref,
  formatIndianNumber,
  formatMetric,
  marketHref
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
// ₹0.1Cr to ₹100Cr profit reads as +99,900%). Rank movers only among companies
// with a real profit base and a believable variance band so the numbers look honest.
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
  const gainers = topGainers(companies, 6).map(toMover);
  const losers = topLosers(companies, 6).map(toMover);
  const qualityLeaders = topCompanies(companies, "rocePct", 6);

  const sectors = [...roots]
    .filter((node) => node.companyCount > 0)
    .sort((a, b) => b.companyCount - a.companyCount);
  const sectorCards = sectors.slice(0, 6).map((node) => ({
    node,
    leaders: getTopCompaniesForNode(node.code, "marketCapCr", 4)
  }));

  const fullDataCompanies = getAvailableStockCodes()
    .slice(0, 6)
    .map((code) => {
      const stock = getStock(code);
      return stock ? { code, name: stock.overview.companyName ?? code } : null;
    })
    .filter((entry): entry is { code: string; name: string } => entry !== null);

  return (
    <main className={css(styles, "landing-page")}>
      {/* Hero */}
      <section className={css(styles, "dash-hero")}>
        <div className={css(styles, "dash-hero-inner")}>
          <h1 className={css(styles, "dash-hero-title")}>
            Research every listed Indian company in one place
          </h1>
          <p className={css(styles, "dash-hero-sub")}>
            Screen, compare, and dig into financials, ratios, and shareholding — all from fast,
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

      {/* Market overview: indices, commodities, currency */}
      <MarketOverview />

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

      {/* Market movers + quality leaders */}
      <section className={css(styles, "dash-section dash-two-col")}>
        <div className={css(styles, "dash-col-main")}>
          <div className={css(styles, "dash-section-head")}>
            <h2 className={css(styles, "dash-section-title")}>
              <BarChart3 size={18} aria-hidden="true" />
              Market movers
            </h2>
          </div>
          <MarketMoversTabs gainers={gainers} losers={losers} />
        </div>

        <aside className={css(styles, "dash-col-side")}>
          <div className={css(styles, "dash-section-head")}>
            <h2 className={css(styles, "dash-section-title")}>
              <Trophy size={18} aria-hidden="true" />
              Top by ROCE
            </h2>
          </div>
          <ul className={css(styles, "dash-rank-list")}>
            {qualityLeaders.map((company) => (
              <li key={company.code}>
                <Link href={companyHref(company.code)} className={css(styles, "dash-rank-row")}>
                  <span className={css(styles, "dash-rank-name")}>
                    <CompanyLogoMark code={company.code} name={company.name} size="sm" />
                    <span>{company.name}</span>
                  </span>
                  <span className={css(styles, "numeric dash-rank-val up")}>
                    {formatMetric(company.rocePct, "percent")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* Browse by sector cards */}
      <section className={css(styles, "dash-section")}>
        <div className={css(styles, "dash-section-head")}>
          <h2 className={css(styles, "dash-section-title")}>Browse by sector</h2>
          <Link className={css(styles, "dash-view-all")} href="/market/">
            All sectors
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className={css(styles, "dash-sector-grid")}>
          {sectorCards.map(({ node, leaders }) => (
            <Link key={node.code} href={marketHref(node.path)} className={css(styles, "dash-sectorcard")}>
              <div className={css(styles, "dash-sectorcard-head")}>
                <span className={css(styles, "dash-sectorcard-icon")} aria-hidden="true">
                  <SectorIcon name={node.name} size={16} />
                </span>
                <span className={css(styles, "dash-sectorcard-title")}>{node.name}</span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </div>
              <span className={css(styles, "dash-sectorcard-count")}>
                {formatIndianNumber(node.companyCount)} companies
              </span>
              <ul className={css(styles, "dash-sectorcard-list")}>
                {leaders.map((company) => (
                  <li key={company.code}>
                    <span className={css(styles, "dash-sectorcard-co")}>
                      <CompanyLogoMark code={company.code} name={company.name} size="sm" />
                      <span>{company.name}</span>
                    </span>
                    <span className={css(styles, "numeric dash-sectorcard-mcap")}>
                      {formatMetric(company.marketCapCr, "crore")}
                    </span>
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom: full-analysis companies + tool promo */}
      <section className={css(styles, "dash-section dash-bottom-grid")}>
        <div className={css(styles, "dash-bottom-col")}>
          <div className={css(styles, "dash-section-head")}>
            <h2 className={css(styles, "dash-section-title")}>In-depth analysis available</h2>
          </div>
          <ul className={css(styles, "dash-link-list")}>
            {fullDataCompanies.map((company) => (
              <li key={company.code}>
                <Link href={companyHref(company.code)} className={css(styles, "dash-link-row")}>
                  <span className={css(styles, "dash-link-name")}>
                    <CompanyLogoMark code={company.code} name={company.name} size="sm" />
                    <span>{company.name}</span>
                  </span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Link className={css(styles, "dash-tool-promo")} href={candlestickToolHref()}>
          <h3>Candlestick &amp; OHLC tool</h3>
          <p>Plot any stock&apos;s price history with volume and moving averages.</p>
          <span className={css(styles, "dash-promo-action")}>
            Open the tool
            <ArrowRight size={14} aria-hidden="true" />
          </span>
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
