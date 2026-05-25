export type HierarchyLevel = "sector" | "group" | "industry" | "leaf";

export type IndustryDepth = 1 | 2 | 3 | 4;

export type IndustryNode = {
  code: string;
  name: string;
  depth: IndustryDepth;
  path: string[];
  names: string[];
  description?: string;
  children: string[];
  companyCount: number;
};

export type Company = {
  serial: string;
  code: string;
  name: string;
  cmp: number | null;
  pe: number | null;
  marketCapCr: number | null;
  divYieldPct: number | null;
  npQtrCr: number | null;
  profitVarPct: number | null;
  salesQtrCr: number | null;
  salesVarPct: number | null;
  rocePct: number | null;
  sector: { code: string; name: string };
  group: { code: string; name: string };
  industry: { code: string; name: string };
  leaf: { code: string; name: string };
  description: string;
  scrapePage?: string;
  scrapeUrl?: string;
  scrapedAt?: string;
};

export type PricePoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type FinRow = {
  label: string;
  values: Record<string, string>;
  expandable: boolean;
  children: FinRow[];
};

export type FinancialTable = {
  periods: string[];
  rows: FinRow[];
};

export type DocLink = {
  title: string;
  url: string;
};

export type Stock = {
  ticker: string;
  sourceUrl: string;
  overview: {
    companyName: string;
    currentPriceRaw: string;
    about: string;
  };
  keyMetrics: Record<string, string>;
  prosCons: {
    pros: string[];
    cons: string[];
  };
  quarterly: FinancialTable;
  profitLoss: FinancialTable;
  balanceSheet: FinancialTable;
  cashFlows: FinancialTable;
  ratios: FinancialTable;
  shareholding: {
    quarterly: FinancialTable;
    yearly: FinancialTable;
  };
  investors: {
    quarterly: Record<string, Record<string, Record<string, string>>>;
    yearly: Record<string, Record<string, Record<string, string>>>;
  };
  documents: {
    announcements: DocLink[];
    annualReports: DocLink[];
    creditRatings: DocLink[];
    concalls: DocLink[];
  };
};
