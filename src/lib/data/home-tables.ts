// Static content for the home-page "Volume spurt" and "Research reports"
// sections. The dataset has no traded-volume or broker-call fields, so these
// are hand-maintained samples anchored to REAL company codes/names — links
// resolve to live company pages via companyHref. Site ships fully static.

export type VolumeSpurt = {
  code: string; // real company code → company page
  name: string;
  volTodayLac: number; // today's volume, in lakhs
  volAvgLac: number; // 2-week average volume, in lakhs
  volTimes: number; // volume change multiple
  ltp: number; // last traded price ₹
  changePct: number; // day change %, signed
};

// Ordered by volume-change multiple, descending (matches the BSE report).
export const VOLUME_SPURTS: VolumeSpurt[] = [
  { code: "NYKAA", name: "FSN E-Commerce", volTodayLac: 2245.5, volAvgLac: 2.75, volTimes: 816.5, ltp: 265.4, changePct: -1.99 },
  { code: "LAURUSLABS", name: "Laurus Labs", volTodayLac: 50.03, volAvgLac: 0.2, volTimes: 248.2, ltp: 1112.8, changePct: 7.94 },
  { code: "GLENMARK", name: "Glenmark Pharma.", volTodayLac: 15.41, volAvgLac: 0.12, volTimes: 132.7, ltp: 2420.8, changePct: 18.52 },
  { code: "BIOCON", name: "Biocon", volTodayLac: 78.48, volAvgLac: 0.84, volTimes: 93.6, ltp: 363.3, changePct: 4.97 },
  { code: "LUPIN", name: "Lupin", volTodayLac: 59.33, volAvgLac: 1.61, volTimes: 36.8, ltp: 2310.9, changePct: -0.26 },
  { code: "ZYDUSLIFE", name: "Zydus Lifesci.", volTodayLac: 6.08, volAvgLac: 0.19, volTimes: 31.3, ltp: 913.7, changePct: 10.28 },
  { code: "ALKEM", name: "Alkem Lab", volTodayLac: 5.32, volAvgLac: 0.2, volTimes: 26.9, ltp: 5348.6, changePct: -7.65 },
  { code: "AUROPHARMA", name: "Aurobindo Pharma", volTodayLac: 1.98, volAvgLac: 0.09, volTimes: 23.1, ltp: 1397.9, changePct: 1.04 }
];

export type ReportAction = "Buy" | "Sell" | "Hold" | "Accumulate" | "Initiating Coverage";

export type ResearchReport = {
  id: string;
  code: string; // real company code → company page
  company: string;
  action: ReportAction;
  target: number; // target price ₹
  broker: string;
  date: string; // display date, e.g. "15 Jun 2026"
};

export const RESEARCH_REPORTS: ResearchReport[] = [
  { id: "r1", code: "TITAN", company: "Titan Company", action: "Buy", target: 4900, broker: "JM Financial", date: "15 Jun 2026" },
  { id: "r2", code: "RELIANCE", company: "Reliance Industries", action: "Buy", target: 1650, broker: "Motilal Oswal", date: "15 Jun 2026" },
  { id: "r3", code: "SUNPHARMA", company: "Sun Pharma.Inds.", action: "Accumulate", target: 1920, broker: "ICICI Securities", date: "12 Jun 2026" },
  { id: "r4", code: "LUPIN", company: "Lupin", action: "Initiating Coverage", target: 2600, broker: "Motilal Oswal", date: "09 Jun 2026" },
  { id: "r5", code: "ZYDUSLIFE", company: "Zydus Lifesci.", action: "Buy", target: 1080, broker: "JM Financial", date: "09 Jun 2026" },
  { id: "r6", code: "DRREDDY", company: "Dr Reddy's Labs", action: "Hold", target: 1350, broker: "Kotak Inst. Equities", date: "05 Jun 2026" },
  { id: "r7", code: "DIVISLAB", company: "Divi's Lab.", action: "Buy", target: 7400, broker: "Nuvama", date: "05 Jun 2026" }
];
