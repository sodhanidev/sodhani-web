// Static content for the home-page "Screener + News + Advisory" band.
// Site ships fully static, so these are hand-maintained samples.

export type ScreenCard = {
  id: string;
  name: string;
  rule: string;
  count: number;
  /** Sparkline tone: maps to a CSS stroke color. */
  tone: "green" | "blue" | "violet" | "amber";
  spark: number[];
};

export type NewsItem = {
  id: string;
  headline: string;
  source: string;
  ago: string;
};

export const POPULAR_SCREENS: ScreenCard[] = [
  {
    id: "high-roe",
    name: "High ROE Stocks",
    rule: "ROE > 20% & Net Profit Growth > 15%",
    count: 210,
    tone: "green",
    spark: [12, 16, 14, 20, 22, 28, 26, 33]
  },
  {
    id: "low-debt",
    name: "Low Debt Companies",
    rule: "Debt to Equity < 0.5 & ROCE > 15%",
    count: 145,
    tone: "blue",
    spark: [8, 11, 13, 12, 18, 17, 24, 27]
  },
  {
    id: "strong-momentum",
    name: "Strong Momentum",
    rule: "Price above 50 & 200 DMA with RSI > 70",
    count: 98,
    tone: "violet",
    spark: [6, 9, 12, 16, 19, 23, 27, 31]
  },
  {
    id: "dividend-yielders",
    name: "Dividend Yielders",
    rule: "Dividend Yield > 2% & Payout Ratio < 60%",
    count: 122,
    tone: "amber",
    spark: [10, 12, 11, 15, 16, 19, 21, 25]
  }
];

export const RA_SCREENS: ScreenCard[] = [
  {
    id: "ra-quality",
    name: "Quality Compounders",
    rule: "ROCE > 18% & 5Y Profit CAGR > 20%",
    count: 64,
    tone: "green",
    spark: [9, 12, 15, 14, 19, 22, 24, 29]
  },
  {
    id: "ra-turnaround",
    name: "Turnaround Bets",
    rule: "Profit positive after 2Y loss & Sales up",
    count: 38,
    tone: "violet",
    spark: [4, 6, 5, 9, 13, 12, 18, 23]
  },
  {
    id: "ra-smallcap",
    name: "Smallcap Movers",
    rule: "Mcap < 5,000 Cr & 50D return > 15%",
    count: 81,
    tone: "amber",
    spark: [7, 10, 9, 14, 16, 21, 20, 26]
  },
  {
    id: "ra-cashrich",
    name: "Cash-Rich Value",
    rule: "Cash > 30% Mcap & P/E < 15",
    count: 47,
    tone: "blue",
    spark: [11, 10, 13, 15, 14, 18, 21, 23]
  }
];

export const TAB_SCREENS: { id: string; label: string; screens: ScreenCard[] }[] = [
  { id: "popular", label: "Popular Screens", screens: POPULAR_SCREENS },
  { id: "ra", label: "Created by RAs", screens: RA_SCREENS },
  { id: "mine", label: "My Screens", screens: [] }
];

export const MARKET_NEWS: NewsItem[] = [
  {
    id: "rbi-repo",
    headline: "RBI keeps repo rate unchanged; focuses on inflation outlook",
    source: "Economic Times",
    ago: "2h ago"
  },
  {
    id: "it-rally",
    headline: "IT stocks rally as US tech spending outlook improves",
    source: "Moneycontrol",
    ago: "4h ago"
  },
  {
    id: "crude-rise",
    headline: "Crude oil prices rise amid Middle East tensions",
    source: "Business Standard",
    ago: "5h ago"
  }
];

export const ADVISORY_BULLETS = [
  "Publish calls & build credibility",
  "Reach thousands of investors",
  "Powerful analytics & insights",
  "Grow your brand"
];
