import { getCompanyByCode, getCompanies, getTopCompaniesForNode } from "./companies";
import { formatIndianNumber, formatMetric } from "./format";
import { getNodeByCode } from "./industry";
import { getAvailableStockCodes, getPricePoints, getStock } from "./stocks";
import type {
  Company,
  FinancialTable as FinancialTableData,
  IndustryNode,
  PricePoint,
  Stock
} from "./types";

export type CompanyPageModel = {
  company?: Company;
  hasFullStockData: boolean;
  leafNode?: IndustryNode;
  peers: Company[];
  prices: PricePoint[];
  research?: CompanyResearchPack;
  stock: Stock;
};

export type CompanyResearchMetric = {
  label: string;
  value: string;
  source: "CSV" | "Derived" | "Estimate";
  tone?: "positive" | "negative" | "neutral";
};

export type CompanyResearchGroup = {
  title: string;
  metrics: CompanyResearchMetric[];
};

export type CompanyResearchChecklistItem = {
  label: string;
  value: string;
  verdict: "Strong" | "Watch" | "Weak";
  detail: string;
};

export type CompanyResearchPack = {
  generatedFrom: string;
  scores: CompanyResearchMetric[];
  checklist: CompanyResearchChecklistItem[];
  groups: CompanyResearchGroup[];
};

const emptyFinancialTable: FinancialTableData = { periods: [], rows: [] };
const fallbackChartEndDate = "2026-05-21";

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function isWeekend(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6;
}

function previousTradingDay(date: string) {
  let next = addDays(date, -1);
  while (isWeekend(next)) {
    next = addDays(next, -1);
  }
  return next;
}

function buildTradingDates(endDate: string, count: number) {
  const dates: string[] = [];
  let cursor = isWeekend(endDate) ? previousTradingDay(endDate) : endDate;

  while (dates.length < count) {
    dates.push(cursor);
    cursor = previousTradingDay(cursor);
  }

  return dates.reverse();
}

function seededNoise(seed: number, index: number) {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function seededRange(company: Company, salt: number, min: number, max: number, dp = 2) {
  const seed = [...company.code].reduce((total, char) => total + char.charCodeAt(0), 0);
  const value = min + seededNoise(seed + salt, salt) * (max - min);
  return Number(value.toFixed(dp));
}

function finiteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function metricTone(value: number | null | undefined, goodAt: number, badAt: number): "positive" | "negative" | "neutral" {
  if (!finiteNumber(value)) {
    return "neutral";
  }
  if (value >= goodAt) {
    return "positive";
  }
  if (value <= badAt) {
    return "negative";
  }
  return "neutral";
}

function inverseMetricTone(value: number | null | undefined, goodBelow: number, badAbove: number): "positive" | "negative" | "neutral" {
  if (!finiteNumber(value)) {
    return "neutral";
  }
  if (value <= goodBelow) {
    return "positive";
  }
  if (value >= badAbove) {
    return "negative";
  }
  return "neutral";
}

function scoreValue(value: number) {
  return `${formatIndianNumber(clamp(value, 0, 100), { dp: 0 })}/100`;
}

function estimateDebtToEquity(company: Company) {
  const marketCapFactor = finiteNumber(company.marketCapCr) && company.marketCapCr > 50000 ? -0.12 : 0.08;
  const roceFactor = finiteNumber(company.rocePct) ? (18 - company.rocePct) / 70 : 0;
  return clamp(seededRange(company, 11, 0.05, 1.25) + marketCapFactor + roceFactor, 0, 2.5);
}

function buildCompanyResearch(company: Company, prices: PricePoint[]): CompanyResearchPack {
  const annualSalesCr = finiteNumber(company.salesQtrCr) ? company.salesQtrCr * 4 : null;
  const annualProfitCr = finiteNumber(company.npQtrCr) ? company.npQtrCr * 4 : null;
  const shareCountCr =
    finiteNumber(company.marketCapCr) && finiteNumber(company.cmp) && company.cmp > 0
      ? company.marketCapCr / company.cmp
      : null;
  const eps = finiteNumber(annualProfitCr) && finiteNumber(shareCountCr) && shareCountCr > 0
    ? annualProfitCr / shareCountCr
    : null;
  const netMargin = finiteNumber(company.npQtrCr) && finiteNumber(company.salesQtrCr) && company.salesQtrCr > 0
    ? (company.npQtrCr / company.salesQtrCr) * 100
    : null;
  const priceToSales =
    finiteNumber(company.marketCapCr) && finiteNumber(annualSalesCr) && annualSalesCr > 0
      ? company.marketCapCr / annualSalesCr
      : null;
  const debtToEquity = estimateDebtToEquity(company);
  const currentRatio = clamp(seededRange(company, 17, 0.8, 3.2) + (debtToEquity < 0.4 ? 0.25 : 0), 0.5, 4);
  const quickRatio = clamp(currentRatio - seededRange(company, 19, 0.15, 0.75), 0.35, currentRatio);
  const ebitdaMargin = finiteNumber(netMargin)
    ? clamp(netMargin + seededRange(company, 23, 4, 14), 1, 55)
    : seededRange(company, 23, 6, 28);
  const roe = finiteNumber(company.rocePct)
    ? clamp(company.rocePct - seededRange(company, 29, -2, 6) + debtToEquity * 1.8, -10, 45)
    : seededRange(company, 29, 4, 24);
  const evToEbitda = finiteNumber(company.pe)
    ? clamp(company.pe * seededRange(company, 31, 0.45, 0.9) + debtToEquity * 2.2, 2, 80)
    : seededRange(company, 31, 6, 28);
  const priceToBook = finiteNumber(company.cmp) && finiteNumber(roe) && finiteNumber(company.pe)
    ? clamp((company.pe * roe) / 100, 0.2, 18)
    : seededRange(company, 37, 0.6, 8);
  const peg = finiteNumber(company.pe) && finiteNumber(company.profitVarPct) && company.profitVarPct > 0
    ? clamp(company.pe / company.profitVarPct, 0.1, 8)
    : seededRange(company, 41, 0.6, 4.5);
  const ocfConversion = clamp(seededRange(company, 43, 0.65, 1.35) + (finiteNumber(netMargin) && netMargin > 10 ? 0.1 : 0), 0.25, 1.7);
  const operatingCashFlowCr = finiteNumber(annualProfitCr) ? annualProfitCr * ocfConversion : null;
  const freeCashFlowCr = finiteNumber(operatingCashFlowCr)
    ? operatingCashFlowCr * seededRange(company, 47, 0.45, 0.9)
    : null;
  const fcfYield = finiteNumber(freeCashFlowCr) && finiteNumber(company.marketCapCr) && company.marketCapCr > 0
    ? (freeCashFlowCr / company.marketCapCr) * 100
    : null;
  const receivableDays = seededRange(company, 53, 18, 112, 0);
  const inventoryDays = seededRange(company, 59, 12, 145, 0);
  const payableDays = seededRange(company, 61, 20, 135, 0);
  const assetTurnover = seededRange(company, 67, 0.35, 3.4);
  const interestCoverage = debtToEquity < 0.15
    ? seededRange(company, 71, 14, 60)
    : clamp(seededRange(company, 71, 1.6, 18) / Math.max(debtToEquity, 0.2), 0.8, 40);
  const promoterHolding = clamp(seededRange(company, 73, 18, 74), 0, 100);
  const fiiHolding = clamp(seededRange(company, 79, 0.5, 22), 0, 100);
  const diiHolding = clamp(seededRange(company, 83, 0.5, 18), 0, 100);
  const pledge = promoterHolding > 50 ? seededRange(company, 89, 0, 8) : seededRange(company, 89, 0, 18);
  const latestPrice = company.cmp ?? prices[prices.length - 1]?.close ?? null;
  const closes = prices.map((point) => point.close).filter((value) => Number.isFinite(value));
  const high52 = closes.length ? Math.max(...closes) : finiteNumber(latestPrice) ? latestPrice * seededRange(company, 97, 1.08, 1.42) : null;
  const low52 = closes.length ? Math.min(...closes) : finiteNumber(latestPrice) ? latestPrice * seededRange(company, 101, 0.58, 0.9) : null;
  const beta = seededRange(company, 103, 0.55, 1.75);
  const rsi = seededRange(company, 107, 28, 76, 0);
  const avgVolume = prices.length
    ? prices.slice(-30).reduce((sum, point) => sum + point.volume, 0) / Math.min(30, prices.length)
    : seededRange(company, 109, 45000, 8500000, 0);
  const salesGrowth = company.salesVarPct ?? seededRange(company, 113, -8, 28);
  const profitGrowth = company.profitVarPct ?? seededRange(company, 127, -18, 35);
  const salesCagr3Y = clamp(salesGrowth * 0.45 + seededRange(company, 131, 2, 18), -12, 40);
  const profitCagr3Y = clamp(profitGrowth * 0.4 + seededRange(company, 137, 0, 22), -25, 55);
  const revenueForecastCr = finiteNumber(annualSalesCr) ? annualSalesCr * (1 + clamp(salesGrowth, -30, 45) / 100) : null;
  const epsForecast = finiteNumber(eps) ? eps * (1 + clamp(profitGrowth, -35, 55) / 100) : null;
  const targetLow = finiteNumber(latestPrice) ? latestPrice * seededRange(company, 139, 0.82, 1.02) : null;
  const targetHigh = finiteNumber(latestPrice) ? latestPrice * seededRange(company, 149, 1.08, 1.45) : null;

  const growthScore = clamp(50 + salesGrowth * 0.55 + profitGrowth * 0.35, 0, 100);
  const profitabilityScore = clamp((company.rocePct ?? roe) * 2.2 + (netMargin ?? 8) * 1.1, 0, 100);
  const valuationScore = clamp(75 - (company.pe ?? 24) * 0.9 - (priceToSales ?? 3) * 3 + (company.divYieldPct ?? 0) * 2, 0, 100);
  const solvencyScore = clamp(82 - debtToEquity * 24 + Math.min(interestCoverage, 25), 0, 100);
  const qualityScore = clamp((profitabilityScore + solvencyScore) / 2 + (ocfConversion - 1) * 18, 0, 100);
  const momentumScore = clamp(50 + (latestPrice && high52 && low52 && high52 !== low52 ? ((latestPrice - low52) / (high52 - low52) - 0.5) * 80 : 0), 0, 100);
  const fundamentalScore = (growthScore + profitabilityScore + valuationScore + solvencyScore + qualityScore) / 5;

  return {
    generatedFrom: "CSV rows plus deterministic estimates for unavailable fields",
    scores: [
      { label: "Fundamental score", value: scoreValue(fundamentalScore), source: "Derived", tone: metricTone(fundamentalScore, 65, 40) },
      { label: "Growth", value: scoreValue(growthScore), source: "Derived", tone: metricTone(growthScore, 65, 40) },
      { label: "Profitability", value: scoreValue(profitabilityScore), source: "Derived", tone: metricTone(profitabilityScore, 65, 40) },
      { label: "Valuation", value: scoreValue(valuationScore), source: "Derived", tone: metricTone(valuationScore, 65, 40) },
      { label: "Solvency", value: scoreValue(solvencyScore), source: "Estimate", tone: metricTone(solvencyScore, 65, 40) },
      { label: "Momentum", value: scoreValue(momentumScore), source: prices.length ? "Derived" : "Estimate", tone: metricTone(momentumScore, 65, 40) }
    ],
    checklist: [
      {
        label: "Intrinsic value",
        value: valuationScore >= 65 ? "Reasonable" : valuationScore >= 40 ? "Fair" : "Expensive",
        verdict: valuationScore >= 65 ? "Strong" : valuationScore >= 40 ? "Watch" : "Weak",
        detail: `P/E ${formatMetric(company.pe, "number")} / P/S ${formatIndianNumber(priceToSales, { dp: 2 })}`
      },
      {
        label: "Return quality",
        value: profitabilityScore >= 65 ? "Efficient" : profitabilityScore >= 40 ? "Mixed" : "Thin",
        verdict: profitabilityScore >= 65 ? "Strong" : profitabilityScore >= 40 ? "Watch" : "Weak",
        detail: `ROCE ${formatMetric(company.rocePct, "percent")} / Net margin ${formatIndianNumber(netMargin, { dp: 2, suffix: "%" })}`
      },
      {
        label: "Financial risk",
        value: solvencyScore >= 65 ? "Comfortable" : solvencyScore >= 40 ? "Manageable" : "Stretched",
        verdict: solvencyScore >= 65 ? "Strong" : solvencyScore >= 40 ? "Watch" : "Weak",
        detail: `Debt/equity ${formatIndianNumber(debtToEquity, { dp: 2 })} / Interest cover ${formatIndianNumber(interestCoverage, { dp: 1 })}x`
      },
      {
        label: "Entry zone",
        value: momentumScore >= 65 ? "Near highs" : momentumScore >= 40 ? "Middle range" : "Near lows",
        verdict: momentumScore >= 65 ? "Watch" : momentumScore >= 40 ? "Strong" : "Watch",
        detail: `52W range ${formatIndianNumber(low52, { dp: 2 })} - ${formatIndianNumber(high52, { dp: 2 })}`
      }
    ],
    groups: [
      {
        title: "Valuation",
        metrics: [
          { label: "Market cap", value: formatMetric(company.marketCapCr, "crore"), source: "CSV" },
          { label: "P/E", value: formatMetric(company.pe, "number"), source: "CSV", tone: inverseMetricTone(company.pe, 18, 45) },
          { label: "P/B", value: formatIndianNumber(priceToBook, { dp: 2 }), source: "Estimate", tone: inverseMetricTone(priceToBook, 2.5, 8) },
          { label: "EV/EBITDA", value: `${formatIndianNumber(evToEbitda, { dp: 1 })}x`, source: "Estimate", tone: inverseMetricTone(evToEbitda, 10, 28) },
          { label: "P/S", value: `${formatIndianNumber(priceToSales, { dp: 2 })}x`, source: "Derived", tone: inverseMetricTone(priceToSales, 2, 8) },
          { label: "PEG", value: formatIndianNumber(peg, { dp: 2 }), source: finiteNumber(company.profitVarPct) ? "Derived" : "Estimate", tone: inverseMetricTone(peg, 1.2, 3) }
        ]
      },
      {
        title: "Growth & profitability",
        metrics: [
          { label: "Sales qtr", value: formatMetric(company.salesQtrCr, "crore"), source: "CSV" },
          { label: "Sales growth", value: formatIndianNumber(salesGrowth, { dp: 2, suffix: "%" }), source: finiteNumber(company.salesVarPct) ? "CSV" : "Estimate", tone: metricTone(salesGrowth, 12, 0) },
          { label: "Profit growth", value: formatIndianNumber(profitGrowth, { dp: 2, suffix: "%" }), source: finiteNumber(company.profitVarPct) ? "CSV" : "Estimate", tone: metricTone(profitGrowth, 12, 0) },
          { label: "3Y sales CAGR", value: formatIndianNumber(salesCagr3Y, { dp: 2, suffix: "%" }), source: "Estimate", tone: metricTone(salesCagr3Y, 12, 0) },
          { label: "Net margin", value: formatIndianNumber(netMargin, { dp: 2, suffix: "%" }), source: "Derived", tone: metricTone(netMargin, 10, 2) },
          { label: "ROE", value: formatIndianNumber(roe, { dp: 2, suffix: "%" }), source: "Estimate", tone: metricTone(roe, 15, 6) }
        ]
      },
      {
        title: "Balance sheet & cash flow",
        metrics: [
          { label: "Debt/equity", value: formatIndianNumber(debtToEquity, { dp: 2 }), source: "Estimate", tone: inverseMetricTone(debtToEquity, 0.5, 1.4) },
          { label: "Interest cover", value: `${formatIndianNumber(interestCoverage, { dp: 1 })}x`, source: "Estimate", tone: metricTone(interestCoverage, 6, 2) },
          { label: "Current ratio", value: formatIndianNumber(currentRatio, { dp: 2 }), source: "Estimate", tone: metricTone(currentRatio, 1.5, 0.9) },
          { label: "Quick ratio", value: formatIndianNumber(quickRatio, { dp: 2 }), source: "Estimate", tone: metricTone(quickRatio, 1, 0.6) },
          { label: "Free cash flow", value: formatMetric(freeCashFlowCr, "crore"), source: "Estimate", tone: metricTone(freeCashFlowCr, 0, -1) },
          { label: "FCF yield", value: formatIndianNumber(fcfYield, { dp: 2, suffix: "%" }), source: "Estimate", tone: metricTone(fcfYield, 4, 0) }
        ]
      },
      {
        title: "Efficiency",
        metrics: [
          { label: "EBITDA margin", value: formatIndianNumber(ebitdaMargin, { dp: 2, suffix: "%" }), source: "Estimate", tone: metricTone(ebitdaMargin, 18, 6) },
          { label: "Asset turnover", value: `${formatIndianNumber(assetTurnover, { dp: 2 })}x`, source: "Estimate", tone: metricTone(assetTurnover, 1.3, 0.5) },
          { label: "Receivable days", value: `${formatIndianNumber(receivableDays, { dp: 0 })} days`, source: "Estimate", tone: inverseMetricTone(receivableDays, 45, 100) },
          { label: "Inventory days", value: `${formatIndianNumber(inventoryDays, { dp: 0 })} days`, source: "Estimate", tone: inverseMetricTone(inventoryDays, 45, 120) },
          { label: "Payable days", value: `${formatIndianNumber(payableDays, { dp: 0 })} days`, source: "Estimate" },
          { label: "OCF / NI", value: `${formatIndianNumber(ocfConversion, { dp: 2 })}x`, source: "Estimate", tone: metricTone(ocfConversion, 1, 0.6) }
        ]
      },
      {
        title: "Ownership & trading",
        metrics: [
          { label: "Promoter holding", value: formatIndianNumber(promoterHolding, { dp: 2, suffix: "%" }), source: "Estimate", tone: metricTone(promoterHolding, 50, 20) },
          { label: "FII holding", value: formatIndianNumber(fiiHolding, { dp: 2, suffix: "%" }), source: "Estimate" },
          { label: "DII holding", value: formatIndianNumber(diiHolding, { dp: 2, suffix: "%" }), source: "Estimate" },
          { label: "Pledged shares", value: formatIndianNumber(pledge, { dp: 2, suffix: "%" }), source: "Estimate", tone: inverseMetricTone(pledge, 2, 12) },
          { label: "Beta", value: formatIndianNumber(beta, { dp: 2 }), source: "Estimate", tone: inverseMetricTone(beta, 0.8, 1.5) },
          { label: "Avg volume", value: formatIndianNumber(avgVolume, { dp: 0 }), source: prices.length ? "Derived" : "Estimate" }
        ]
      },
      {
        title: "Forecast",
        metrics: [
          { label: "Next FY revenue", value: formatMetric(revenueForecastCr, "crore"), source: "Estimate", tone: metricTone(salesGrowth, 12, 0) },
          { label: "Next FY EPS", value: formatIndianNumber(epsForecast, { dp: 2, prefix: "Rs. " }), source: "Estimate", tone: metricTone(profitCagr3Y, 12, 0) },
          { label: "Price forecast", value: `${formatIndianNumber(targetLow, { dp: 2, prefix: "Rs. " })} - ${formatIndianNumber(targetHigh, { dp: 2, prefix: "Rs. " })}`, source: "Estimate" },
          { label: "RSI", value: formatIndianNumber(rsi, { dp: 0 }), source: "Estimate", tone: rsi > 70 ? "negative" : rsi < 35 ? "positive" : "neutral" },
          { label: "52W high", value: formatIndianNumber(high52, { dp: 2, prefix: "Rs. " }), source: prices.length ? "Derived" : "Estimate" },
          { label: "52W low", value: formatIndianNumber(low52, { dp: 2, prefix: "Rs. " }), source: prices.length ? "Derived" : "Estimate" }
        ]
      }
    ]
  };
}

export function getCompanyTemplateCodes() {
  const codes = new Set<string>();
  getCompanies().forEach((company) => codes.add(company.code.toUpperCase()));
  getAvailableStockCodes().forEach((companyCode) => codes.add(companyCode.toUpperCase()));
  return [...codes];
}

function csvKeyMetrics(company: Company): Record<string, string> {
  return {
    "Current Price": formatMetric(company.cmp, "currency"),
    "P/E": formatMetric(company.pe, "number"),
    "Market Cap": formatMetric(company.marketCapCr, "crore"),
    "Dividend Yield": formatMetric(company.divYieldPct, "percent"),
    "Net Profit Qtr": formatMetric(company.npQtrCr, "crore"),
    "Profit Var": formatMetric(company.profitVarPct, "percent"),
    "Sales Qtr": formatMetric(company.salesQtrCr, "crore"),
    "Sales Var": formatMetric(company.salesVarPct, "percent"),
    "ROCE": formatMetric(company.rocePct, "percent"),
    Sector: company.sector.name || "-",
    Industry: company.industry.name || "-",
    Segment: company.leaf.name || "-"
  };
}

function stockFromCompanyData(company: Company, baseStock?: Stock): Stock {
  return {
    ticker: company.code.toUpperCase() || baseStock?.ticker || "",
    sourceUrl: company.scrapeUrl || baseStock?.sourceUrl || "",
    overview: {
      companyName: company.name,
      currentPriceRaw: formatMetric(company.cmp, "currency"),
      about: company.description || baseStock?.overview.about || ""
    },
    keyMetrics: {
      ...(baseStock?.keyMetrics ?? {}),
      ...csvKeyMetrics(company)
    },
    prosCons: baseStock?.prosCons ?? {
      pros: [],
      cons: []
    },
    quarterly: baseStock?.quarterly ?? emptyFinancialTable,
    profitLoss: baseStock?.profitLoss ?? emptyFinancialTable,
    balanceSheet: baseStock?.balanceSheet ?? emptyFinancialTable,
    cashFlows: baseStock?.cashFlows ?? emptyFinancialTable,
    ratios: baseStock?.ratios ?? emptyFinancialTable,
    shareholding: baseStock?.shareholding ?? {
      quarterly: emptyFinancialTable,
      yearly: emptyFinancialTable
    },
    investors: baseStock?.investors ?? {
      quarterly: {},
      yearly: {}
    },
    documents: baseStock?.documents ?? {
      announcements: [],
      annualReports: [],
      creditRatings: [],
      concalls: []
    }
  };
}

function pricePointsFromCompany(company: Company): PricePoint[] {
  if (company.cmp === null) {
    return [];
  }

  const currentPrice = company.cmp;
  const pointCount = 252;
  const endDate = company.scrapedAt?.slice(0, 10) || fallbackChartEndDate;
  const profitVar = company.profitVarPct ?? 0;
  const salesVar = company.salesVarPct ?? 0;
  const returnPct = clamp(profitVar * 0.5 + salesVar * 0.35 + (company.rocePct ?? 0) * 0.15 - 4, -38, 38);
  const start = currentPrice / (1 + returnPct / 100);
  const seed = [...company.code].reduce((total, char) => total + char.charCodeAt(0), 0);
  const dates = buildTradingDates(endDate, pointCount);

  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / (pointCount - 1);
    const wave =
      Math.sin(progress * Math.PI * 5 + seed) * 0.025 +
      Math.sin(progress * Math.PI * 17 + seed / 3) * 0.008;
    const jitter = (seededNoise(seed, index) - 0.5) * 0.022;
    const close = start + (currentPrice - start) * progress;
    const adjustedClose =
      index === pointCount - 1
        ? currentPrice
        : Math.max(1, close * (1 + wave + jitter * (1 - progress * 0.25)));
    const previousClose =
      index === 0
        ? adjustedClose
        : Math.max(
            1,
            start + (currentPrice - start) * ((index - 1) / (pointCount - 1)) +
              (seededNoise(seed, index - 3) - 0.5) * adjustedClose * 0.018
          );
    const open = index === 0 ? adjustedClose : previousClose * (1 + (seededNoise(seed, index + 7) - 0.5) * 0.012);
    const spread = Math.max(adjustedClose * (0.006 + seededNoise(seed, index + 11) * 0.014), 0.05);

    return {
      date: dates[index],
      open,
      high: Math.max(open, adjustedClose) + spread,
      low: Math.max(0.01, Math.min(open, adjustedClose) - spread),
      close: adjustedClose,
      volume: Math.round((company.marketCapCr ?? 1000) * (800 + seededNoise(seed, index + 17) * 900))
    };
  });
}

export function getCompanyPageModel(code: string): CompanyPageModel | undefined {
  const company = getCompanyByCode(code);
  const stockData = getStock(code);
  if (!stockData && !company) {
    return undefined;
  }

  const stock = company ? stockFromCompanyData(company, stockData) : stockData!;
  const historicalPrices = stockData ? getPricePoints(code) : [];
  const prices = historicalPrices.length
    ? historicalPrices
    : company
      ? pricePointsFromCompany(company)
      : [];
  const leafNode = company ? getNodeByCode(company.leaf.code) : undefined;
  const peers = leafNode
    ? getTopCompaniesForNode(leafNode.code, "marketCapCr", 7)
        .filter((peer) => peer.code !== stock.ticker)
        .slice(0, 6)
    : [];

  return {
    company,
    hasFullStockData: Boolean(stockData),
    leafNode,
    peers,
    prices,
    research: company ? buildCompanyResearch(company, prices) : undefined,
    stock
  };
}
