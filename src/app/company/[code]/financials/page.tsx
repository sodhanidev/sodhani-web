import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FinancialsDetailsView } from "@/components/company/FinancialsDetailsView";
import { getCompanyPageModel } from "@/lib/data/company-template";
import { getStock } from "@/lib/data/stocks";

type PageProps = {
  params: Promise<{ code: string }>;
};

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const stock = await getStock(code);

  return {
    title: stock ? `${stock.overview.companyName} Financials · ${stock.ticker}` : "Financials",
    description: stock
      ? `Quarterly and annual financial statements for ${stock.overview.companyName}.`
      : "Company financial statements."
  };
}

export default async function FinancialsDetailsPage({ params }: PageProps) {
  const { code } = await params;
  const model = await getCompanyPageModel(code);

  if (!model) {
    notFound();
  }

  return <FinancialsDetailsView model={model} />;
}
