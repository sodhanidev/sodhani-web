// Sample research-analyst (RA) calls and a market-breadth/VIX snapshot for the
// homepage board. The site ships fully static and has no analyst-call feed, so
// the RA calls below are HAND-AUTHORED SAMPLE DATA for layout/demo purposes —
// not a live advisory feed. The breadth counts are derived from real company
// data at render time (see `computeBreadth`); only the VIX value is a snapshot.

import { getCompanies } from "./companies";

export type RaCall = {
  id: string;
  analyst: string;
  /** Initials shown in the avatar bubble. */
  initials: string;
  /** Avatar bubble background colour. */
  tone: "blue" | "violet" | "teal" | "amber" | "rose";
  company: string;
  action: "BUY" | "SELL" | "HOLD";
  /** Latest traded price, ₹. */
  cmp: number;
  /** Analyst target price, ₹. */
  target: number;
  /** Day change %, signed. */
  changePct: number;
  /** Relative timestamp label, e.g. "2h ago". */
  when: string;
};

// Hand-authored sample calls. Upside is derived from cmp → target.
export const RA_CALLS: RaCall[] = [
  {
    id: "ra-hdfcbank",
    analyst: "Amit Kumar",
    initials: "AK",
    tone: "blue",
    company: "HDFC Bank",
    action: "BUY",
    cmp: 1678.9,
    target: 1850,
    changePct: 0.21,
    when: "2h ago"
  },
  {
    id: "ra-tcs",
    analyst: "Priya Sharma",
    initials: "PS",
    tone: "violet",
    company: "Tata Consultancy Services",
    action: "BUY",
    cmp: 3890.25,
    target: 4200,
    changePct: 0.74,
    when: "3h ago"
  },
  {
    id: "ra-reliance",
    analyst: "Vivek Raj",
    initials: "VR",
    tone: "teal",
    company: "Reliance Industries",
    action: "BUY",
    cmp: 2956.4,
    target: 3250,
    changePct: 1.28,
    when: "5h ago"
  },
  {
    id: "ra-infosys",
    analyst: "Neha Patel",
    initials: "NP",
    tone: "amber",
    company: "Infosys Limited",
    action: "BUY",
    cmp: 1502.3,
    target: 1650,
    changePct: 1.02,
    when: "6h ago"
  },
  {
    id: "ra-icicibank",
    analyst: "Saurabh Singh",
    initials: "SS",
    tone: "rose",
    company: "ICICI Bank",
    action: "BUY",
    cmp: 1243.6,
    target: 1400,
    changePct: 0.33,
    when: "1d ago"
  }
];

/** Upside to target as a percentage, derived from cmp and target. */
export function raUpsidePct(call: RaCall): number {
  if (!call.cmp) {
    return 0;
  }
  return ((call.target - call.cmp) / call.cmp) * 100;
}

export type MarketBreadth = {
  advances: number;
  unchanged: number;
  declines: number;
  /** India VIX snapshot (hand-maintained, like the index snapshots). */
  vix: number;
  vixChangePct: number;
  /** Recent VIX points, oldest → newest, for the sparkline. */
  vixSpark: number[];
};

// Breadth from real company data: quarterly profit variation as the up/down
// signal (the dataset has no intraday price change). Honest counts, labelled
// as advances/declines to match a standard breadth widget.
export function getMarketBreadth(): MarketBreadth {
  const companies = getCompanies();
  let advances = 0;
  let unchanged = 0;
  let declines = 0;

  for (const company of companies) {
    const v = company.profitVarPct;
    if (typeof v !== "number") {
      continue;
    }
    if (v > 0) {
      advances += 1;
    } else if (v < 0) {
      declines += 1;
    } else {
      unchanged += 1;
    }
  }

  return {
    advances,
    unchanged,
    declines,
    vix: 12.85,
    vixChangePct: -0.45,
    vixSpark: [13.4, 13.32, 13.18, 13.05, 12.98, 13.02, 12.9, 12.85]
  };
}
