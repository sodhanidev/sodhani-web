import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CandlestickChartTool } from "@/components/CandlestickChartTool";
import {
  getCandlestickCodes,
  getCandlestickSeries
} from "@/lib/data/candlestick";
import { companyHref } from "@/lib/data/format";

type PageProps = {
  params: Promise<{ code: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getCandlestickCodes().map((code) => ({ code }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const series = getCandlestickSeries(code);

  return {
    title: series ? `${series.name} · ${series.code}` : "Candlestick Chart",
    description: series ? `Advanced OHLC candlestick chart for ${series.name}.` : "Advanced OHLC candlestick chart."
  };
}

export default async function CompanyCandlestickPage({ params }: PageProps) {
  const { code } = await params;
  const series = getCandlestickSeries(code);

  if (!series) {
    notFound();
  }

  return (
    <CandlestickChartTool
      backHref={companyHref(series.code)}
      initialCode={series.code}
      locked
      series={[series]}
    />
  );
}
