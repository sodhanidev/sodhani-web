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
      },
      {
        id: "niftymidcap",
        label: "NIFTY MIDCAP",
        value: 58420.3,
        changePct: 0.88,
        dp: 2,
        spark: [57840, 57910, 58020, 57980, 58140, 58260, 58330, 58420]
      },
      {
        id: "niftysmallcap",
        label: "NIFTY SMLCAP",
        value: 18972.6,
        changePct: -0.54,
        dp: 2,
        spark: [19080, 19120, 19040, 19010, 18960, 18990, 18940, 18973]
      },
      {
        id: "niftyfmcg",
        label: "NIFTY FMCG",
        value: 56210.15,
        changePct: 0.31,
        dp: 2,
        spark: [56040, 56010, 56120, 56090, 56150, 56180, 56160, 56210]
      },
      {
        id: "niftyauto",
        label: "NIFTY AUTO",
        value: 23845.7,
        changePct: 1.27,
        dp: 2,
        spark: [23510, 23560, 23640, 23590, 23710, 23780, 23810, 23846]
      },
      {
        id: "niftypharma",
        label: "NIFTY PHARMA",
        value: 21380.45,
        changePct: -0.21,
        dp: 2,
        spark: [21440, 21460, 21410, 21390, 21360, 21400, 21370, 21380]
      },
      {
        id: "niftymetal",
        label: "NIFTY METAL",
        value: 9214.8,
        changePct: 1.95,
        dp: 2,
        spark: [9020, 9060, 9110, 9090, 9160, 9180, 9200, 9215]
      },
      {
        id: "niftyrealty",
        label: "NIFTY REALTY",
        value: 1042.35,
        changePct: 1.64,
        dp: 2,
        spark: [1018, 1022, 1029, 1025, 1034, 1038, 1040, 1042]
      },
      {
        id: "niftyenergy",
        label: "NIFTY ENERGY",
        value: 38914.7,
        changePct: -0.43,
        dp: 2,
        spark: [39080, 39120, 39010, 38980, 38940, 38970, 38930, 38915]
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
      },
      {
        id: "naturalgas",
        label: "NAT GAS",
        value: 248.6,
        changePct: -1.45,
        dp: 1,
        prefix: "₹",
        spark: [252.8, 253.4, 251.2, 250.6, 249.8, 250.1, 249.2, 248.6]
      },
      {
        id: "copper",
        label: "COPPER",
        value: 842.35,
        changePct: 0.73,
        dp: 2,
        prefix: "₹",
        spark: [835.2, 836.8, 838.4, 837.6, 840.1, 841.2, 841.8, 842.35]
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
      },
      {
        id: "gbpinr",
        label: "GBP / INR",
        value: 105.64,
        changePct: 0.27,
        dp: 2,
        spark: [105.2, 105.28, 105.41, 105.36, 105.49, 105.55, 105.6, 105.64]
      },
      {
        id: "jpyinr",
        label: "JPY / INR",
        value: 0.5312,
        changePct: -0.18,
        dp: 4,
        spark: [0.5325, 0.5331, 0.5322, 0.5318, 0.5309, 0.5314, 0.5316, 0.5312]
      },
      {
        id: "aedinr",
        label: "AED / INR",
        value: 22.71,
        changePct: 0.05,
        dp: 2,
        spark: [22.69, 22.7, 22.72, 22.7, 22.71, 22.72, 22.7, 22.71]
      }
    ]
  }
];

export function getMarketOverview(): MarketQuoteGroup[] {
  return MARKET_OVERVIEW;
}
