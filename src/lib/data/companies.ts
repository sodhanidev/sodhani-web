import fs from "node:fs";
import path from "node:path";

import { parseCsvRows, rowsToObjects } from "./csv";
import { cleanDisplayName, parseNumericCell } from "./format";
import { getIndustryData } from "./industry";
import type { Company, IndustryNode } from "./types";

const COMPANY_FILE = path.join(process.cwd(), "category_wise", "companies.csv");
let rawCache: Company[] | null = null;
let dedupedCache: Company[] | null = null;

function normalizeCompany(row: Record<string, string>): Company {
  return {
    serial: row["S.No."] ?? "",
    code: (row["Company Code"] ?? "").trim(),
    name: cleanDisplayName(row.Name ?? ""),
    cmp: parseNumericCell(row["CMPRs."]),
    pe: parseNumericCell(row["P/E"]),
    marketCapCr: parseNumericCell(row["Mar CapRs.Cr."]),
    divYieldPct: parseNumericCell(row["Div Yld%"]),
    npQtrCr: parseNumericCell(row["NP QtrRs.Cr."]),
    profitVarPct: parseNumericCell(row["Qtr Profit Var%"]),
    salesQtrCr: parseNumericCell(row["Sales QtrRs.Cr."]),
    salesVarPct: parseNumericCell(row["Qtr Sales Var%"]),
    rocePct: parseNumericCell(row["ROCE%"]),
    sector: {
      code: (row.sector_code ?? "").trim(),
      name: cleanDisplayName(row.sector_name ?? "")
    },
    group: {
      code: (row.group_code ?? "").trim(),
      name: cleanDisplayName(row.group_name ?? "")
    },
    industry: {
      code: (row.industry_code ?? "").trim(),
      name: cleanDisplayName(row.industry_name ?? "")
    },
    leaf: {
      code: (row.leaf_code ?? "").trim(),
      name: cleanDisplayName(row.leaf_name ?? "")
    },
    description: cleanDisplayName(row.description ?? ""),
    scrapePage: row._scrape_page,
    scrapeUrl: row._scrape_url,
    scrapedAt: row._scraped_at
  };
}

function preferNewerCompany(existing: Company, candidate: Company): Company {
  if (candidate.scrapedAt && !existing.scrapedAt) {
    return candidate;
  }
  if (!candidate.scrapedAt && existing.scrapedAt) {
    return existing;
  }
  if (candidate.scrapedAt && existing.scrapedAt && candidate.scrapedAt > existing.scrapedAt) {
    return candidate;
  }
  return existing;
}

export function getRawCompanies(): Company[] {
  if (rawCache) {
    return rawCache;
  }

  rawCache = rowsToObjects(parseCsvRows(fs.readFileSync(COMPANY_FILE, "utf8")))
    .map(normalizeCompany)
    .filter((company) => Boolean(company.code && company.name));

  return rawCache;
}

export function getCompanies(): Company[] {
  if (dedupedCache) {
    return dedupedCache;
  }

  const byKey = new Map<string, Company>();
  getRawCompanies().forEach((company) => {
    const key = `${company.code}|${company.leaf.code}`;
    const existing = byKey.get(key);
    byKey.set(key, existing ? preferNewerCompany(existing, company) : company);
  });

  dedupedCache = [...byKey.values()];
  attachCompanyCounts(dedupedCache);
  return dedupedCache;
}

function attachCompanyCounts(companies: Company[]) {
  const { nodes } = getIndustryData();
  nodes.forEach((node) => {
    node.companyCount = 0;
  });

  companies.forEach((company) => {
    [company.sector.code, company.group.code, company.industry.code, company.leaf.code].forEach(
      (code) => {
        const node = nodes.get(code);
        if (node) {
          node.companyCount += 1;
        }
      }
    );
  });
}

export function getCompaniesForNode(node: IndustryNode): Company[] {
  return getCompanies().filter((company) => {
    if (node.depth === 1) {
      return company.sector.code === node.code;
    }
    if (node.depth === 2) {
      return company.group.code === node.code;
    }
    if (node.depth === 3) {
      return company.industry.code === node.code;
    }
    return company.leaf.code === node.code;
  });
}

export function getCompanyByCode(code: string): Company | undefined {
  const normalized = code.toUpperCase();
  return getCompanies()
    .filter((company) => company.code.toUpperCase() === normalized)
    .sort((a, b) => (b.marketCapCr ?? 0) - (a.marketCapCr ?? 0))[0];
}

export function topCompanies(
  companies: Company[],
  metric: keyof Pick<Company, "marketCapCr" | "rocePct" | "profitVarPct">,
  limit = 10
): Company[] {
  return [...companies]
    .filter((company) => typeof company[metric] === "number" && (company[metric] ?? 0) > 0)
    .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
    .slice(0, limit);
}
