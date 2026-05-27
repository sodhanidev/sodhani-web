import { parseNumericCell } from "./format";
import type { DocLink, FinancialTable, PricePoint, Stock } from "./types";

const SCREENER_ORIGIN = "https://www.screener.in";
const LIVE_REVALIDATE_SECONDS = 15 * 60;
const emptyFinancialTable: FinancialTable = { periods: [], rows: [] };

type ScreenerChartDataset = {
  metric: string;
  values: Array<[string, string | number, unknown?]>;
};

type ScreenerChartResponse = {
  datasets?: ScreenerChartDataset[];
};

export type LiveScreenerStock = {
  fetchedAt: string;
  prices: PricePoint[];
  sourceUrl: string;
  stock: Stock;
};

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\""
  };

  return value
    .replace(/&#(\d+);/gu, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/giu, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/giu, (entity, name: string) => named[name.toLowerCase()] ?? entity);
}

function cleanText(html: string): string {
  return decodeHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script>/giu, " ")
      .replace(/<style\b[\s\S]*?<\/style>/giu, " ")
      .replace(/<[^>]+>/gu, " ")
  )
    .replace(/\s+/gu, " ")
    .replace(/\s+\+/gu, "")
    .trim();
}

function getAttribute(tag: string, attribute: string): string {
  const match = new RegExp(`${attribute}=["']([^"']+)["']`, "iu").exec(tag);
  return match ? decodeHtml(match[1]) : "";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function extractTagById(html: string, tagName: string, id: string): string {
  const startMatch = new RegExp(`<${tagName}\\b[^>]*\\bid=["']${escapeRegExp(id)}["'][^>]*>`, "iu").exec(html);
  if (!startMatch) {
    return "";
  }

  const start = startMatch.index;
  const nextSection = /\n\s*<section\b[^>]*\bid=["'][^"']+["'][^>]*>/giu;
  nextSection.lastIndex = start + startMatch[0].length;
  const nextMatch = nextSection.exec(html);
  return html.slice(start, nextMatch?.index ?? html.length);
}

function extractTopCard(html: string): string {
  const startMatch = /<div\b[^>]*\bid=["']top["'][^>]*>/iu.exec(html);
  if (!startMatch) {
    return "";
  }

  const start = startMatch.index;
  const nextSection = /\n\s*<section\b[^>]*\bid=["'][^"']+["'][^>]*>/iu.exec(html.slice(start));
  return html.slice(start, nextSection ? start + nextSection.index : html.length);
}

function extractFirst(regex: RegExp, html: string): string {
  return regex.exec(html)?.[1] ?? "";
}

function parseCompanyName(topCard: string, code: string): string {
  const heading = cleanText(extractFirst(/<h1\b[^>]*>([\s\S]*?)<\/h1>/iu, topCard));
  return heading || code.toUpperCase();
}

function parseAbout(topCard: string): string {
  const aboutBlock = extractFirst(/<div\b[^>]*class=["'][^"']*\babout\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/iu, topCard);
  const paragraph = extractFirst(/<p\b[^>]*>([\s\S]*?)<\/p>/iu, aboutBlock);
  return cleanText(paragraph || aboutBlock).replace(/\bshow more\b/iu, "").trim();
}

function parseTopRatios(html: string): Record<string, string> {
  const ratios: Record<string, string> = {};
  const list = extractFirst(/<ul\b[^>]*\bid=["']top-ratios["'][^>]*>([\s\S]*?)<\/ul>/iu, html);

  for (const match of list.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/giu)) {
    const item = match[1];
    const name = cleanText(extractFirst(/<span\b[^>]*class=["'][^"']*\bname\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/iu, item));
    const value = cleanText(extractFirst(/<span\b[^>]*class=["'][^"']*\bvalue\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/iu, item));
    if (name && value) {
      ratios[name] = value;
    }
  }

  return ratios;
}

function parseListItems(block: string): string[] {
  return [...block.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/giu)]
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
}

function parseProsCons(html: string): Stock["prosCons"] {
  const analysis = extractTagById(html, "section", "analysis");
  const prosBlock = extractFirst(/<div\b[^>]*class=["'][^"']*\bpros\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/iu, analysis);
  const consBlock = extractFirst(/<div\b[^>]*class=["'][^"']*\bcons\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/iu, analysis);

  return {
    pros: parseListItems(prosBlock),
    cons: parseListItems(consBlock)
  };
}

function parseTable(section: string): FinancialTable {
  const table = extractFirst(/<table\b[^>]*>([\s\S]*?)<\/table>/iu, section);
  if (!table) {
    return emptyFinancialTable;
  }

  const head = extractFirst(/<thead\b[^>]*>([\s\S]*?)<\/thead>/iu, table);
  const periods = [...head.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/giu)]
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
  const dataPeriods = periods.slice(1);
  const body = extractFirst(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/iu, table);
  const rows = [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/giu)]
    .map((rowMatch) => {
      const cells = [...rowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/giu)].map((cell) => cleanText(cell[1]));
      const [labelCell, ...values] = cells;
      const label = (labelCell ?? "").replace(/\s*\+\s*$/u, "").trim();
      const rowValues: Record<string, string> = {};
      dataPeriods.forEach((period, index) => {
        rowValues[period] = values[index] || "";
      });

      return {
        label,
        values: rowValues,
        expandable: false,
        children: []
      };
    })
    .filter((row) => Boolean(row.label));

  return {
    periods: dataPeriods,
    rows
  };
}

function parseDocumentLinks(block: string): DocLink[] {
  const links = [...block.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/giu)]
    .map((match) => {
      const url = getAttribute(match[1], "href");
      const title = cleanText(match[2]);
      return { title, url };
    })
    .filter((link) => link.url.startsWith("http") && link.title && link.title.toLowerCase() !== "all");

  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.url)) {
      return false;
    }
    seen.add(link.url);
    return true;
  });
}

function extractDocumentBlock(documents: string, heading: string): string {
  const headingMatch = new RegExp(`<h3\\b[^>]*>\\s*${escapeRegExp(heading)}\\s*</h3>`, "iu").exec(documents);
  if (!headingMatch) {
    return "";
  }

  const start = headingMatch.index;
  const nextHeading = /<h3\b[^>]*>/giu;
  nextHeading.lastIndex = start + headingMatch[0].length;
  const nextMatch = nextHeading.exec(documents);
  return documents.slice(start, nextMatch?.index ?? documents.length);
}

function parseDocuments(html: string): Stock["documents"] {
  const documents = extractTagById(html, "section", "documents");

  return {
    announcements: parseDocumentLinks(extractDocumentBlock(documents, "Announcements")),
    annualReports: parseDocumentLinks(extractDocumentBlock(documents, "Annual reports")),
    creditRatings: parseDocumentLinks(extractDocumentBlock(documents, "Credit ratings")),
    concalls: parseDocumentLinks(extractDocumentBlock(documents, "Concalls"))
  };
}

function parseCompanyId(html: string): { companyId?: string; consolidated: boolean } {
  const infoTag = /<div\b[^>]*\bid=["']company-info["'][^>]*>/iu.exec(html)?.[0] ?? "";
  return {
    companyId: getAttribute(infoTag, "data-company-id"),
    consolidated: getAttribute(infoTag, "data-consolidated") === "true"
  };
}

async function fetchScreenerHtml(code: string): Promise<{ html: string; sourceUrl: string } | undefined> {
  const safeCode = encodeURIComponent(code.toUpperCase());
  const urls = [
    `${SCREENER_ORIGIN}/company/${safeCode}/consolidated/`,
    `${SCREENER_ORIGIN}/company/${safeCode}/`
  ];

  for (const sourceUrl of urls) {
    try {
      const response = await fetch(sourceUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "Mozilla/5.0 compatible; SodhaniLiveData/1.0"
        },
        next: { revalidate: LIVE_REVALIDATE_SECONDS }
      });
      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      if (html.includes("id=\"company-info\"") || html.includes("id='company-info'")) {
        return { html, sourceUrl: response.url || sourceUrl };
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

async function fetchChartPrices(companyId: string, consolidated: boolean): Promise<PricePoint[]> {
  const chartUrl = new URL(`/api/company/${companyId}/chart/`, SCREENER_ORIGIN);
  chartUrl.searchParams.set("q", "Price-Volume");
  chartUrl.searchParams.set("days", "365");
  if (consolidated) {
    chartUrl.searchParams.set("consolidated", "true");
  }

  try {
    const response = await fetch(chartUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 compatible; SodhaniLiveData/1.0"
      },
      next: { revalidate: LIVE_REVALIDATE_SECONDS }
    });
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as ScreenerChartResponse;
    const priceDataset = data.datasets?.find((dataset) => dataset.metric === "Price");
    const volumeDataset = data.datasets?.find((dataset) => dataset.metric === "Volume");
    if (!priceDataset?.values?.length) {
      return [];
    }

    const volumes = new Map<string, number>();
    volumeDataset?.values?.forEach(([date, volume]) => {
      volumes.set(String(date), parseNumericCell(volume) ?? 0);
    });

    return priceDataset.values
      .map(([date, price]) => {
        const close = parseNumericCell(price);
        if (close === null) {
          return undefined;
        }

        return {
          date: String(date),
          open: close,
          high: close,
          low: close,
          close,
          volume: volumes.get(String(date)) ?? 0
        };
      })
      .filter((point): point is PricePoint => Boolean(point));
  } catch {
    return [];
  }
}

function stockFromHtml(code: string, sourceUrl: string, html: string): Stock {
  const topCard = extractTopCard(html);
  const keyMetrics = parseTopRatios(html);

  return {
    ticker: code.toUpperCase(),
    sourceUrl,
    overview: {
      companyName: parseCompanyName(topCard, code),
      currentPriceRaw: keyMetrics["Current Price"] || "",
      about: parseAbout(topCard)
    },
    keyMetrics,
    prosCons: parseProsCons(html),
    quarterly: parseTable(extractTagById(html, "section", "quarters")),
    profitLoss: parseTable(extractTagById(html, "section", "profit-loss")),
    balanceSheet: parseTable(extractTagById(html, "section", "balance-sheet")),
    cashFlows: parseTable(extractTagById(html, "section", "cash-flow")),
    ratios: parseTable(extractTagById(html, "section", "ratios")),
    shareholding: {
      quarterly: parseTable(extractTagById(html, "section", "shareholding")),
      yearly: emptyFinancialTable
    },
    investors: {
      quarterly: {},
      yearly: {}
    },
    documents: parseDocuments(html)
  };
}

export async function getLiveScreenerStock(code: string): Promise<LiveScreenerStock | undefined> {
  const fetched = await fetchScreenerHtml(code);
  if (!fetched) {
    return undefined;
  }

  const { companyId, consolidated } = parseCompanyId(fetched.html);

  return {
    fetchedAt: new Date().toISOString(),
    prices: companyId ? await fetchChartPrices(companyId, consolidated) : [],
    sourceUrl: fetched.sourceUrl,
    stock: stockFromHtml(code, fetched.sourceUrl, fetched.html)
  };
}
