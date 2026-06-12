import type { Metadata } from "next";

import { TradingViewReference } from "@/components/TradingViewReference";
import { getCandlestickCatalog } from "@/lib/data/candlestick";

export const metadata: Metadata = {
  title: "TradingView Reference · SAFEedge",
  description: "Isolated TradingView-style candlestick reference page for chart design exploration."
};

export default function TradingViewReferencePage() {
  return <TradingViewReference series={getCandlestickCatalog()} />;
}
