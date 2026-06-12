// Codes that have a real brand SVG under public/logos/<code>.svg.
// Static manifest so this works in both Server and Client Components
// (no node:fs, which would break the client bundle). Add a code here
// when you drop a new <code>.svg into public/logos/.
export const COMPANY_LOGO_CODES: ReadonlySet<string> = new Set([
  "503685",
  "505343",
  "513295",
  "526799",
  "530609",
  "531319",
  "BAJFINANCE",
  "BHARTIARTL",
  "HDFCBANK",
  "ICICIBANK",
  "LT",
  "RELIANCE",
  "SBIN",
  "TCS"
]);
