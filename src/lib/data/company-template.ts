import { getCompanyByCode, getCompaniesForNode } from "./companies";
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
    peers: related.peers,
    peerSource: related.source,
    prices: getPricePoints(code),
    stock: stockData
  };
}
