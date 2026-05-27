import { getCompanyByCode, getCompanies, getTopCompaniesForNode } from "./companies";
import { formatMetric } from "./format";
import { getNodeByCode } from "./industry";
import { getLiveScreenerStock } from "./screener-live";
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
  liveFetchedAt?: string;
  liveSource?: string;
  peers: Company[];
  prices: PricePoint[];
  stock: Stock;
};

const emptyFinancialTable: FinancialTableData = { periods: [], rows: [] };

export function getCompanyTemplateCodes() {
  const codes = new Set<string>();
  getCompanies().forEach((company) => codes.add(company.code.toUpperCase()));
  getAvailableStockCodes().forEach((companyCode) => codes.add(companyCode.toUpperCase()));
  return [...codes];
}

function screenerCompanyUrl(code: string) {
  return `https://www.screener.in/company/${encodeURIComponent(code.toUpperCase())}/`;
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

function stockFromCompanyData(
  company: Company,
  baseStock?: Stock,
  preferBaseStock = false
): Stock {
  const csvMetrics = csvKeyMetrics(company);
  const baseMetrics = baseStock?.keyMetrics ?? {};

  return {
    ticker: (baseStock?.ticker || company.code).toUpperCase(),
    sourceUrl: baseStock?.sourceUrl || company.scrapeUrl || screenerCompanyUrl(company.code),
    overview: {
      companyName:
        preferBaseStock && baseStock?.overview.companyName
          ? baseStock.overview.companyName
          : company.name,
      currentPriceRaw:
        preferBaseStock && baseStock?.overview.currentPriceRaw
          ? baseStock.overview.currentPriceRaw
          : formatMetric(company.cmp, "currency"),
      about: baseStock?.overview.about || company.description || ""
    },
    keyMetrics: preferBaseStock
      ? {
          ...csvMetrics,
          ...baseMetrics
        }
      : {
          ...baseMetrics,
          ...csvMetrics
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

export async function getCompanyPageModel(code: string): Promise<CompanyPageModel | undefined> {
  const company = getCompanyByCode(code);
  const stockData = getStock(code);
  if (!stockData && !company) {
    return undefined;
  }

  const liveData = await getLiveScreenerStock(company?.code ?? code);
  const stock = liveData?.stock
    ? company
      ? stockFromCompanyData(company, liveData.stock, true)
      : liveData.stock
    : company
      ? stockFromCompanyData(company, stockData)
      : stockData!;
  const historicalPrices = liveData?.prices.length
    ? liveData.prices
    : stockData
      ? getPricePoints(code)
      : [];
  const leafNode = company ? getNodeByCode(company.leaf.code) : undefined;
  const peers = leafNode
    ? getTopCompaniesForNode(leafNode.code, "marketCapCr", 7)
        .filter((peer) => peer.code.toUpperCase() !== stock.ticker)
        .slice(0, 6)
    : [];

  return {
    company,
    hasFullStockData: Boolean(liveData?.stock || stockData),
    leafNode,
    liveFetchedAt: liveData?.fetchedAt,
    liveSource: liveData?.sourceUrl,
    peers,
    prices: historicalPrices,
    stock
  };
}
