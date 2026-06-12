import type { Metadata } from "next";

import { CandlestickChartTool } from "@/components/CandlestickChartTool";
import { getCandlestickCatalog } from "@/lib/data/candlestick";

export const metadata: Metadata = {
  title: "Candlestick Chart · SAFEedge",
  description: "Search and inspect OHLC candlestick charts for companies with available price data."
};

export default function CandlestickToolPage() {
  const catalog = getCandlestickCatalog();

  return (
    <CandlestickChartTool
      series={catalog}
      subtitle="Search a company and inspect open, high, low, close, and volume in one advanced chart."
      title="Candlestick Chart"
    />
  );
}
