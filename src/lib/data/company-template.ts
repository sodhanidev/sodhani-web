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
    leafNode,
    peers: related.peers,
    peerSource: related.source,
    prices: getPricePoints(code),
    stock: stockData
  };
}
