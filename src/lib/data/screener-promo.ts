// Static content for the home-page "Screener + News + Advisory" band.
// Site ships fully static, so these are hand-maintained samples.

export type NewsItem = {
  id: string;
  headline: string;
  source: string;
  ago: string;
};

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
