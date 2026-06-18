// Static market-overview snapshots (indices, commodities, currency).
// The site ships fully static, so these are hand-maintained snapshot values
// rather than live quotes. `spark` is a small list of recent points used to
// draw the inline sparkline; only its shape matters, not its scale.
export type MarketQuote = {
  id: string;
  label: string;
  /** Latest value. */
  value: number;
  /** Percent change vs previous close. */
  changePct: number;
  /** Decimal places to render `value` with. */
  dp: number;
  /** Optional prefix, e.g. "₹" or "$". */
  prefix?: string;
  /** Recent points, oldest → newest, for the sparkline. */
  spark: number[];
};

export type MarketQuoteGroup = {
  id: string;
  label: string;
  quotes: MarketQuote[];
};

export const MARKET_OVERVIEW: MarketQuoteGroup[] = [
  {
    id: "indices",
    label: "Indices",
    quotes: [
      {
        id: "nifty50",
        label: "NIFTY 50",
        value: 23907.9,
        changePct: 0.42,
        dp: 2,
        spark: [23740, 23690, 23760, 23720, 23810, 23850, 23830, 23908]
      },
      {
        id: "sensex",
        label: "SENSEX",
        value: 78510.45,
        changePct: 0.38,
        dp: 2,
        spark: [78210, 78140, 78320, 78280, 78390, 78460, 78420, 78510]
      },
      {
        id: "niftybank",
        label: "NIFTY BANK",
        value: 55058.95,
        changePct: -0.12,
        dp: 2,
        spark: [55180, 55210, 55150, 55120, 55090, 55140, 55100, 55059]
      },
      {
        id: "niftyit",
        label: "NIFTY IT",
        value: 29609.85,
        changePct: 2.43,
        dp: 2,
        spark: [28920, 28980, 29080, 29210, 29340, 29410, 29520, 29610]
      }
    ]
  },
  {
    id: "commodities",
    label: "Commodities",
    quotes: [
      {
        id: "gold",
        label: "GOLD (10g)",
        value: 71840,
        changePct: 0.61,
        dp: 0,
        prefix: "₹",
        spark: [71280, 71350, 71420, 71390, 71510, 71600, 71720, 71840]
      },
      {
        id: "silver",
        label: "SILVER (1kg)",
        value: 89250,
        changePct: -0.34,
        dp: 0,
        prefix: "₹",
        spark: [89610, 89540, 89480, 89520, 89390, 89310, 89280, 89250]
      },
      {
        id: "crude",
        label: "CRUDE OIL",
        value: 6184,
        changePct: 1.12,
        dp: 0,
        prefix: "₹",
        spark: [6080, 6055, 6090, 6110, 6135, 6120, 6160, 6184]
      }
    ]
  },
  {
    id: "currency",
    label: "Currency",
    quotes: [
      {
        id: "usdinr",
        label: "USD / INR",
        value: 83.42,
        changePct: -0.08,
        dp: 2,
        spark: [83.5, 83.48, 83.46, 83.49, 83.45, 83.44, 83.43, 83.42]
      },
      {
        id: "eurinr",
        label: "EUR / INR",
        value: 90.18,
        changePct: 0.12,
        dp: 2,
        spark: [89.9, 89.98, 90.05, 90.01, 90.09, 90.12, 90.15, 90.18]
      }
    ]
  }
];

export function getMarketOverview(): MarketQuoteGroup[] {
  return MARKET_OVERVIEW;
}
