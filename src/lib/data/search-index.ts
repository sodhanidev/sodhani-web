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
};

export function getSearchItems(): SearchItem[] {
  const companies = getCompanies().map((company) => ({
    kind: "Company" as const,
    label: company.name,
    meta: `${company.code} · ${company.leaf.name}`,
    href: companyHref(company.code),
    code: company.code
  }));

  const industries = [...getIndustryData().nodes.values()].map((node) => ({
    kind: "Industry" as const,
    label: node.name,
    meta: node.names.join(" / "),
    href: marketHref(node.path),
    code: node.code,
    count: node.companyCount
  }));

  return [...companies, ...industries];
}
