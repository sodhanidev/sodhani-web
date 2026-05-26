import { getCompanyByCode, getCompanies, getTopCompaniesForNode } from "./companies";
import { formatMetric } from "./format";
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
  stock: Stock;
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
    stock
  };
}
