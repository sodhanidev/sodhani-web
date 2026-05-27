import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompanyPageTemplate } from "@/components/company/CompanyPageTemplate";
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
    title: stock ? `${stock.overview.companyName} · ${stock.ticker}` : "Company",
    description: stock ? `Research page for ${stock.overview.companyName}.` : "Company research page."
  };
}

export default async function CompanyPage({ params }: PageProps) {
  const { code } = await params;
  const model = await getCompanyPageModel(code);

  if (!model) {
    notFound();
  }

  return <CompanyPageTemplate model={model} />;
}
