import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompanyPageTemplate } from "@/components/company/CompanyPageTemplate";
import { getCompanyPageModel } from "@/lib/data/company-template";
import { getCompanyByCode } from "@/lib/data/companies";
import { getStock } from "@/lib/data/stocks";

type PageProps = {
  params: Promise<{ code: string }>;
};

export const revalidate = 900;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const stock = getStock(code);
  const company = getCompanyByCode(code);
  return {
    title: company
      ? `${company.name} · ${company.code}`
      : stock
        ? `${stock.overview.companyName} · ${stock.ticker}`
        : "Company",
    description: company
      ? `Listing page for ${company.name}.`
      : stock
        ? `Research page for ${stock.overview.companyName}.`
        : "Company research page."
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
