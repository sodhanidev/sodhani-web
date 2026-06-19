import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompanyPageTemplate } from "@/components/company/CompanyPageTemplate";
import { getCompanyPageModel } from "@/lib/data/company-template";
import { getStock } from "@/lib/data/stocks";

type PageProps = {
  params: Promise<{ code: string }>;
};

// On-demand: any of the ~5,650 companies renders on first visit, then is cached
// by ISR for an hour. Data is fetched live from the equity API per page.
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const stock = await getStock(code);
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
