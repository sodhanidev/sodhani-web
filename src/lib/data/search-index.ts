import { getCompanies } from "./companies";
import { companyHref, marketHref } from "./format";
import { getIndustryData } from "./industry";

export type SearchItem = {
  kind: "Company" | "Industry";
  label: string;
  meta: string;
  href: string;
  code?: string;
  count?: number;
  rank?: number;
};

export function getSearchItems(): SearchItem[] {
  const allCompanies = getCompanies();
  const companyRanks = new Map(
    [...allCompanies]
      .sort((a, b) => (b.marketCapCr ?? 0) - (a.marketCapCr ?? 0))
      .map((company, index) => [company.code, index])
  );

  const companies = allCompanies.map((company) => ({
    kind: "Company" as const,
    label: company.name,
    meta: `${company.code} · ${company.leaf.name}`,
    href: companyHref(company.code),
    code: company.code,
    rank: companyRanks.get(company.code)
  }));

  const industries = [...getIndustryData().nodes.values()].map((node) => ({
    kind: "Industry" as const,
    label: node.name,
    meta: node.names.join(" / "),
    href: marketHref(node.path),
    code: node.code,
    count: node.companyCount,
    rank: -node.companyCount
  }));

  return [...companies, ...industries];
}
