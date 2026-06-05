import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company.module.css";

import { CompanySectionNav, type CompanySectionLink } from "@/components/CompanySectionNav";
import { DocumentsTabs } from "@/components/DocumentsTabs";
import { ShareholdingPieChart } from "@/components/ShareholdingPieChart";
import { SiteFooter } from "@/components/SiteFooter";
import { StockChart } from "@/components/StockChart";
import { StockHeader } from "@/components/StockHeader";
import { FinancialPerformanceExperimental } from "@/components/company/FinancialPerformanceExperimental";
import { FinancialRatiosSnapshot } from "@/components/company/FinancialRatiosSnapshot";
import { RelatedStocks } from "@/components/company/RelatedStocks";
import type { CompanyPageModel } from "@/lib/data/company-template";
import {
  companyCandlestickHref,
  companyShareholdingHref,
  formatIndianNumber,
  parseNumericCell
} from "@/lib/data/format";
import type { FinancialTable as FinancialTableModel, FinRow, PricePoint, Stock } from "@/lib/data/types";

function hasTable(table: FinancialTableModel) {
  return table.periods.length > 0 && table.rows.length > 0;
}

function hasDocuments(documents: Stock["documents"]) {
  return Object.values(documents).some((items) => items.length > 0);
}

type KeyMetricItem = {
  badge?: {
    label: string;
    tone: "derived" | "estimated" | "unavailable";
  };
  label: string;
  value: string;
};

function findFinancialRow(rows: FinRow[], label: string): FinRow | undefined {
  for (const row of rows) {
    if (row.label.toLowerCase() === label.toLowerCase()) {
      return row;
    }

    const child = findFinancialRow(row.children, label);
    if (child) {
      return child;
    }
  }

  return undefined;
}

function getLatestTableValue(table: FinancialTableModel, label: string): string {
  const period = table.periods.at(-1);
  if (!period) {
    return "";
  }

  const row = findFinancialRow(table.rows, label);
  return row?.values[period]?.trim() ?? "";
}

function parseMetricNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  return parseNumericCell(value.replace(/\b(?:cr|crore|shares?)\.?\b/giu, ""));
}

function getSharesOutstanding(stock: Stock): { value: number; estimated: boolean } | undefined {
  const equityCapital = parseMetricNumber(getLatestTableValue(stock.balanceSheet, "Equity Capital"));
  const faceValue = parseMetricNumber(stock.keyMetrics["Face Value"]);

  if (equityCapital !== null && equityCapital > 0 && faceValue !== null && faceValue > 0) {
    return { value: equityCapital / faceValue, estimated: true };
  }

  const marketCap = parseMetricNumber(stock.keyMetrics["Market Cap"]);
  const currentPrice = parseMetricNumber(stock.keyMetrics["Current Price"] || stock.overview.currentPriceRaw);

  if (marketCap !== null && marketCap > 0 && currentPrice !== null && currentPrice > 0) {
    return { value: marketCap / currentPrice, estimated: true };
  }

  return undefined;
}

function getLatestShareholderCount(stock: Stock): string {
  return (
    getLatestTableValue(stock.shareholding.quarterly, "No. of Shareholders") ||
    getLatestTableValue(stock.shareholding.yearly, "No. of Shareholders")
  );
}

function getPointTime(point: PricePoint): number | undefined {
  const time = Date.parse(`${point.date}T00:00:00Z`);
  return Number.isFinite(time) ? time : undefined;
}

function getRangeStart(points: PricePoint[], days: number): number | undefined {
  const latest = points.reduce<number | undefined>((max, point) => {
    const time = getPointTime(point);
    if (time === undefined) {
      return max;
    }

    return max === undefined ? time : Math.max(max, time);
  }, undefined);

  return latest === undefined ? undefined : latest - days * 24 * 60 * 60 * 1000;
}

function getPriceRange(points: PricePoint[], startTime?: number): { high: number; low: number } | undefined {
  let high = Number.NEGATIVE_INFINITY;
  let low = Number.POSITIVE_INFINITY;
  let hasPoint = false;

  points.forEach((point) => {
    const time = getPointTime(point);
    if (startTime !== undefined && (time === undefined || time < startTime)) {
      return;
    }

    high = Math.max(high, point.high);
    low = Math.min(low, point.low);
    hasPoint = true;
  });

  return hasPoint ? { high, low } : undefined;
}

function formatPriceForMetric(value: number) {
  return formatIndianNumber(value, { dp: Number.isInteger(value) ? 0 : 2, prefix: "₹ " });
}

function formatPriceRange(range: { high: number; low: number }) {
  return `${formatPriceForMetric(range.high)} / ${formatPriceForMetric(range.low)}`;
}

function buildKeyMetrics(model: CompanyPageModel): KeyMetricItem[] {
  const { industryPe, marketCapCategory, prices, stock } = model;
  const metrics: KeyMetricItem[] = [];

  const addDirectMetric = (label: string, sourceKey: string) => {
    const value = stock.keyMetrics[sourceKey]?.trim();
    metrics.push(
      value
        ? { label, value }
        : {
            badge: { label: "N/A", tone: "unavailable" },
            label,
            value: "Unavailable"
          }
    );
  };

  const fiftyTwoWeekRange = getPriceRange(prices, getRangeStart(prices, 365));
  const fiftyTwoWeekValue = stock.keyMetrics["High / Low"]?.trim();
  const allTimeRange = getPriceRange(prices);

  const sharesOutstanding = getSharesOutstanding(stock);
  const shareholderCount = getLatestShareholderCount(stock);

  addDirectMetric("Mkt Cap", "Market Cap");
  metrics.push(
    marketCapCategory
      ? {
          badge: { label: "Est.", tone: "estimated" },
          label: "Category",
          value: marketCapCategory
        }
      : {
          badge: { label: "N/A", tone: "unavailable" },
          label: "Category",
          value: "Unavailable"
        }
  );
  addDirectMetric("Price", "Current Price");
  addDirectMetric("Stock P/E", "Stock P/E");
  metrics.push(
    typeof industryPe === "number" && Number.isFinite(industryPe)
      ? {
          badge: { label: "Derived", tone: "derived" },
          label: "Ind. P/E",
          value: formatIndianNumber(industryPe, { dp: 1 })
        }
      : {
          badge: { label: "N/A", tone: "unavailable" },
          label: "Ind. P/E",
          value: "Unavailable"
        }
  );
  metrics.push({
    badge: { label: "N/A", tone: "unavailable" },
    label: "PEG Ratio",
    value: "Unavailable"
  });
  addDirectMetric("ROCE", "ROCE");
  addDirectMetric("ROE", "ROE");
  addDirectMetric("Div Yield", "Dividend Yield");
  addDirectMetric("Book Value", "Book Value");
  addDirectMetric("Face Value", "Face Value");
  metrics.push(
    fiftyTwoWeekValue
      ? { label: "52w H/L", value: fiftyTwoWeekValue }
      : fiftyTwoWeekRange
        ? {
            badge: { label: "Derived", tone: "derived" },
            label: "52w H/L",
            value: formatPriceRange(fiftyTwoWeekRange)
          }
        : {
            badge: { label: "N/A", tone: "unavailable" },
            label: "52w H/L",
            value: "Unavailable"
          }
  );
  metrics.push(
    allTimeRange
      ? {
          badge: { label: "Derived", tone: "derived" },
          label: "All Time H/L",
          value: formatPriceRange(allTimeRange)
        }
      : {
          badge: { label: "N/A", tone: "unavailable" },
          label: "All Time H/L",
          value: "Unavailable"
        }
  );
  if (sharesOutstanding !== undefined) {
    metrics.push({
      badge: { label: sharesOutstanding.estimated ? "Est." : "Derived", tone: "estimated" },
      label: "Shares",
      value: formatIndianNumber(sharesOutstanding.value, { dp: 2, suffix: " Cr" })
    });
  } else {
    metrics.push({
      badge: { label: "N/A", tone: "unavailable" },
      label: "Shares",
      value: "Unavailable"
    });
  }

  if (shareholderCount) {
    metrics.push({
      label: "No. of shareholders",
      value: shareholderCount
    });
  } else {
    metrics.push({
      badge: { label: "N/A", tone: "unavailable" },
      label: "No. of shareholders",
      value: "Unavailable"
    });
  }

  return metrics;
}

export function CompanyPageTemplate({ model }: { model: CompanyPageModel }) {
  const { prices, stock } = model;
  const hasChart = prices.length > 0;
  const keyMetrics = buildKeyMetrics(model);
  const hasKeyMetrics = keyMetrics.length > 0;
  const hasPros = stock.prosCons.pros.length > 0;
  const hasCons = stock.prosCons.cons.length > 0;
  const hasProsCons = hasPros || hasCons;
  const hasAbout = Boolean(stock.overview.about);
  const hasAnalysis = hasProsCons || hasAbout;
  const hasQuarterly = hasTable(stock.quarterly);
  const hasProfitLoss = hasTable(stock.profitLoss);
  const hasBalanceSheet = hasTable(stock.balanceSheet);
  const hasCashFlows = hasTable(stock.cashFlows);
  const hasRatios = hasTable(stock.ratios);
  const hasFinancials = hasQuarterly || hasProfitLoss || hasBalanceSheet || hasCashFlows || hasRatios;
  const hasQuarterlyShareholding = hasTable(stock.shareholding.quarterly);
  const hasYearlyShareholding = hasTable(stock.shareholding.yearly);
  const hasShareholding = hasQuarterlyShareholding || hasYearlyShareholding;
  const hasDocs = hasDocuments(stock.documents);
  const sectionLinks = [
    { id: "overview", label: "Overview" },
    hasAnalysis ? { id: "analysis", label: "Analysis" } : null,
    hasFinancials ? { id: "financials", label: "Financials" } : null,
    hasShareholding ? { id: "shareholding", label: "Shareholding" } : null,
    hasDocs ? { id: "documents", label: "Documents" } : null
  ].filter((link): link is CompanySectionLink => Boolean(link));

  return (
    <>
      <main className={css(styles, "shell page-stack company-page-shell")}>
        <CompanySectionNav links={sectionLinks} />
        <section className={css(styles, "stock-hero")}>
          <StockHeader id="overview" stock={stock} />
          {hasChart ? (
            <StockChart
              advancedHref={companyCandlestickHref(stock.ticker)}
              annualFinancials={stock.profitLoss}
              balanceSheet={stock.balanceSheet}
              faceValueRaw={stock.keyMetrics["Face Value"]}
              id="chart"
              points={prices}
              quarterlyFinancials={stock.quarterly}
            />
          ) : null}
        </section>

        <section className={css(styles, "stock-layout")}>
          <div className={css(styles, "stock-main")}>
            {hasKeyMetrics ? (
              <section className={css(styles, "panel section-anchor")} id="key-metrics">
                <div className={css(styles, "section-title-row")}>
                  <h2>Key Metrics</h2>
                </div>
                <div className={css(styles, "grid metric-grid panel-pad")}>
                  {keyMetrics.map(({ badge, label, value }) => (
                    <div className={css(styles, "metric-card")} key={label}>
                      <div className={css(styles, "metric-label-row")}>
                        <div className={css(styles, "metric-label")}>{label}</div>
                        {badge ? (
                          <span className={css(styles, "metric-badge", `metric-badge-${badge.tone}`)}>
                            {badge.label}
                          </span>
                        ) : null}
                      </div>
                      <div className={css(styles, "metric-value")}>{value}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {hasRatios ? (
              <FinancialRatiosSnapshot annualRatios={stock.ratios} quarterly={stock.quarterly} />
            ) : null}

            {hasProsCons ? (
              <section className={css(styles, "grid pros-cons section-anchor")} id="analysis">
                {hasPros ? (
                  <div className={css(styles, "panel panel-pad")}>
                    <h2>Pros</h2>
                    <ul className={css(styles, "note-list")}>
                      {stock.prosCons.pros.map((item) => (
                        <li className={css(styles, "positive")} key={item}>
                          <CheckCircle2 size={16} aria-hidden="true" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {hasCons ? (
                  <div className={css(styles, "panel panel-pad")}>
                    <h2>Cons</h2>
                    <ul className={css(styles, "note-list")}>
                      {stock.prosCons.cons.map((item) => (
                        <li className={css(styles, "negative")} key={item}>
                          <AlertTriangle size={16} aria-hidden="true" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            {hasAbout ? (
              <section
                className={css(styles, `panel panel-pad${hasProsCons ? "" : " section-anchor"}`)}
                id={hasProsCons ? undefined : "analysis"}
              >
                <h2>About</h2>
                <p>{stock.overview.about}</p>
              </section>
            ) : null}

            {hasFinancials ? (
              <FinancialPerformanceExperimental
                balanceSheet={stock.balanceSheet}
                cashFlows={stock.cashFlows}
                id="financials"
                quarterly={stock.quarterly}
                ticker={stock.ticker}
                yearly={stock.profitLoss}
              />
            ) : null}

            {hasShareholding ? (
              <section className={css(styles, "panel section-anchor")} id="shareholding">
                <div className={css(styles, "section-title-row")}>
                  <h2>Shareholding Pattern</h2>
                  <Link className={css(styles, "shareholding-detail-link")} href={companyShareholdingHref(stock.ticker)}>
                    Show Detailed Information
                    <ChevronRight size={15} aria-hidden="true" />
                  </Link>
                </div>
                <ShareholdingPieChart
                  table={hasQuarterlyShareholding ? stock.shareholding.quarterly : stock.shareholding.yearly}
                />
              </section>
            ) : null}

            <RelatedStocks peers={model.peers} source={model.peerSource} ticker={stock.ticker} />

            {hasDocs ? <DocumentsTabs documents={stock.documents} id="documents" /> : null}
          </div>
        </section>
      </main>
      <SiteFooter className={css(styles, "company-footer")} />
    </>
  );
}
