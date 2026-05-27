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
  prices: PricePoint[];
  stock: Stock;
};

export function getCompanyTemplateCodes() {
  return getAvailableStockCodes();
}

export async function getCompanyPageModel(code: string): Promise<CompanyPageModel | undefined> {
  const stockData = getStock(code);
  if (!stockData) {
    return undefined;
  }

  return {
    hasFullStockData: true,
    peers: [],
    prices: getPricePoints(code),
    stock: stockData
  };
}
