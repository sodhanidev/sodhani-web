// Dev screenshot helper (gitignored scratch). Usage:
//   node scripts/shot.mjs <url> <out.png> [theme] [selector] [width] [height]
// theme = "dark" | "light" (default dark). Sets data-theme on <html>.
// selector (optional) = CSS selector to clip the shot to that element.
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3001/";
const out = process.argv[3] ?? "/tmp/shot.png";
const theme = process.argv[4] ?? "dark";
const selector = process.argv[5] ?? "";
const width = Number(process.argv[6] ?? 1440);
const height = Number(process.argv[7] ?? 1200);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
await page.waitForTimeout(400);

if (selector) {
  const el = await page.$(selector);
  if (!el) {
    console.error(`selector not found: ${selector}`);
    await browser.close();
    process.exit(2);
  }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await el.screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: false });
}
await browser.close();
console.log(`shot -> ${out} (${theme}${selector ? `, ${selector}` : ""})`);
