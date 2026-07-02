// Loader for the committed NSE index snapshot (category_wise/nse_indices.json,
// produced by scripts/prefetch-indices.mjs). Read once at module load and
// cached — the site ships fully static, so nothing fetches at request time.
//
// This is distinct from indices.ts, which holds the hand-maintained
// ticker-tape/market-overview quotes. This file backs the /indices pages:
// per-index heatmaps, breadth, and constituent tables.
import fs from "node:fs";
import path from "node:path";

export type IndexConstituent = {
  code: string;
  name: string;
  ltp: number | null;
  changePct: number | null;
  changeVal: number | null;
  /** Free-float market cap — the weight used to size heatmap tiles. */
  ffmc: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  /** True when a /company/[code] page exists for this constituent. */
  hasPage: boolean;
};

export type IndexBreadth = {
  advances: number;
  declines: number;
  unchanged: number;
};

export type MarketIndex = {
  slug: string;
  label: string;
  kind: "broad" | "sector" | "other";
  value: number | null;
  changePct: number | null;
  changeVal: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  spark: number[];
  breadth: IndexBreadth;
  constituentCount: number;
  constituents: IndexConstituent[];
};

type IndexSnapshot = {
  fetchedAt: string;
  source: string;
  indices: MarketIndex[];
};

const SNAPSHOT_FILE = path.join(process.cwd(), "category_wise", "nse_indices.json");

let cache: IndexSnapshot | null = null;

function load(): IndexSnapshot {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8")) as IndexSnapshot;
  } catch {
    cache = { fetchedAt: "", source: "nseindia.com", indices: [] };
  }
  return cache;
}

export function getIndexSnapshot(): IndexSnapshot {
  return load();
}

export function getAllIndices(): MarketIndex[] {
  return load().indices;
}

export function getIndexSlugs(): string[] {
  return load().indices.map((index) => index.slug);
}

export function getIndexBySlug(slug: string): MarketIndex | undefined {
  return load().indices.find((index) => index.slug === slug);
}
