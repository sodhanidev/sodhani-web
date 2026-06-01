import { getAvailableStockCodes, getPricePoints, getStock } from "./stocks";
import type { PricePoint } from "./types";

export type CandlestickSeries = {
  code: string;
  name: string;
  points: PricePoint[];
};

export function getCandlestickCatalog(): CandlestickSeries[] {
  return getAvailableStockCodes()
    .map((code) => getCandlestickSeries(code))
    .filter((series): series is CandlestickSeries => Boolean(series));
}

export function getCandlestickCodes(): string[] {
  return getCandlestickCatalog().map((series) => series.code);
}

export function getCandlestickSeries(code: string): CandlestickSeries | undefined {
  const stock = getStock(code);
  const points = getPricePoints(code);

  if (!stock || !points.length) {
    return undefined;
  }

  return {
    code: stock.ticker,
    name: stock.overview.companyName,
    points
  };
}
