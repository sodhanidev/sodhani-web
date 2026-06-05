import { getCompanies, getCompanyByCode, getCompaniesForNode } from "./companies";
import { getNodeByCode } from "./industry";
import { getAvailableStockCodes, getPricePoints, getStock } from "./stocks";
import type {
  Company,
  IndustryNode,
  PricePoint,
  Stock
} from "./types";

export type CompanyPageModel = {
  company?: Company;
  hasFullStockData: boolean;
  industryPe?: number;
  leafNode?: IndustryNode;
  marketCapCategory?: string;
  peers: Company[];
  peerSource?: IndustryNode;
  prices: PricePoint[];
  stock: Stock;
};

export function getCompanyTemplateCodes() {
  return getAvailableStockCodes();
}

function getRelatedCompaniesForNode(company: Company, node: IndustryNode): Company[] {
  return getCompaniesForNode(node)
    .filter((peer) => peer.code.toUpperCase() !== company.code.toUpperCase())
    .sort((a, b) => (b.marketCapCr ?? 0) - (a.marketCapCr ?? 0))
    .slice(0, 10);
}

function getRelatedStocks(company: Company): { peers: Company[]; source?: IndustryNode } {
  const sourceNodes = [company.leaf.code, company.industry.code, company.group.code]
    .map((nodeCode) => getNodeByCode(nodeCode))
    .filter((node): node is IndustryNode => Boolean(node));

  for (const source of sourceNodes) {
    const peers = getRelatedCompaniesForNode(company, source);
    if (peers.length) {
      return { peers, source };
    }
  }

  return { peers: [] };
}

function calculatePeForNode(node: IndustryNode): number | undefined {
  const constituents = getCompaniesForNode(node).filter((company) => {
    return (
      typeof company.marketCapCr === "number" &&
      company.marketCapCr > 0 &&
      typeof company.pe === "number" &&
      company.pe > 0
    );
  });

  if (constituents.length < 2) {
    return undefined;
  }

  const totalMarketCap = constituents.reduce((sum, company) => sum + (company.marketCapCr ?? 0), 0);
  const totalEarnings = constituents.reduce((sum, company) => {
    return sum + (company.marketCapCr ?? 0) / (company.pe ?? 1);
  }, 0);

  if (totalEarnings <= 0) {
    return undefined;
  }

  return totalMarketCap / totalEarnings;
}

function getIndustryPe(company: Company): number | undefined {
  const sourceNodes = [company.leaf.code, company.industry.code, company.group.code]
    .map((nodeCode) => getNodeByCode(nodeCode))
    .filter((node): node is IndustryNode => Boolean(node));

  for (const source of sourceNodes) {
    const pe = calculatePeForNode(source);
    if (typeof pe === "number") {
      return pe;
    }
  }

  return undefined;
}

let marketCapRankCache: Map<string, number> | null = null;

function getMarketCapRank(company: Company): number | undefined {
  if (!marketCapRankCache) {
    const byCode = new Map<string, Company>();

    getCompanies().forEach((candidate) => {
      if (typeof candidate.marketCapCr !== "number" || candidate.marketCapCr <= 0) {
        return;
      }

      const code = candidate.code.toUpperCase();
      const existing = byCode.get(code);
      if (!existing || candidate.marketCapCr > (existing.marketCapCr ?? 0)) {
        byCode.set(code, candidate);
      }
    });

    marketCapRankCache = new Map(
      [...byCode.values()]
        .sort((a, b) => (b.marketCapCr ?? 0) - (a.marketCapCr ?? 0))
        .map((candidate, index) => [candidate.code.toUpperCase(), index + 1])
    );
  }

  return marketCapRankCache.get(company.code.toUpperCase());
}

function getMarketCapCategory(company: Company): string | undefined {
  const rank = getMarketCapRank(company);

  if (rank === undefined) {
    return undefined;
  }

  if (rank <= 100) {
    return "Large Cap";
  }

  if (rank <= 250) {
    return "Mid Cap";
  }

  return "Small Cap";
}

export async function getCompanyPageModel(code: string): Promise<CompanyPageModel | undefined> {
  const stockData = getStock(code);
  if (!stockData) {
    return undefined;
  }

  const company = getCompanyByCode(stockData.ticker);
  const leafNode = company ? getNodeByCode(company.leaf.code) : undefined;
  const related = company ? getRelatedStocks(company) : { peers: [] };

  return {
    company,
    hasFullStockData: true,
    industryPe: company ? getIndustryPe(company) : undefined,
    leafNode,
    marketCapCategory: company ? getMarketCapCategory(company) : undefined,
    peers: related.peers,
    peerSource: related.source,
    prices: getPricePoints(code),
    stock: stockData
  };
}
