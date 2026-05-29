import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShareholdingDetailsView } from "@/components/company/ShareholdingDetailsView";
import {
  getCompanyPageModel,
  getCompanyTemplateCodes
} from "@/lib/data/company-template";
import { getStock } from "@/lib/data/stocks";

type PageProps = {
  params: Promise<{ code: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getCompanyTemplateCodes().map((companyCode) => ({ code: companyCode }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const stock = getStock(code);

  return {
    title: stock ? `${stock.overview.companyName} Shareholding · ${stock.ticker}` : "Shareholding Details",
    description: stock
      ? `Shareholding pattern and investor holding details for ${stock.overview.companyName}.`
      : "Company shareholding and investor holding details."
  };
}

export default async function ShareholdingDetailsPage({ params }: PageProps) {
  const { code } = await params;
  const model = await getCompanyPageModel(code);

  if (!model) {
    notFound();
  }

  return <ShareholdingDetailsView model={model} />;
}
