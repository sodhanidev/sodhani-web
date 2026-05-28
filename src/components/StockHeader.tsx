import { formatIndianNumber, marketHref, parseNumericCell } from "@/lib/data/format";
import type { Company, Stock } from "@/lib/data/types";

export function StockHeader({
  stock,
  company,
  id
}: {
  stock: Stock;
  company?: Company;
  id?: string;
}) {
  const currentPrice = stock.keyMetrics["Current Price"] || stock.overview.currentPriceRaw;
  const parsedPrice = parseNumericCell(currentPrice);
  const displayPrice = parsedPrice === null ? currentPrice : formatIndianNumber(parsedPrice, { dp: 2, prefix: "₹ " });

  const industryHref = company ? marketHref(company.leaf.code ? [
    company.sector.code,
    company.group.code,
    company.industry.code,
    company.leaf.code
  ] : []) : "/market/";

  return (
    <section className={`stock-head${id ? " section-anchor" : ""}`} id={id}>
      <div className="stock-logo" aria-hidden="true">
        <span>{stock.ticker.slice(0, 1)}</span>
      </div>
      <div className="stock-quote">
        {company ? (
          <div className="quote-controls">
            <a className="industry-chip" href={industryHref}>
              {company.leaf.name}
            </a>
          </div>
        ) : null}
        <h1>{stock.overview.companyName}</h1>
        {displayPrice ? (
          <div className="price-line">
            <span className="price-value">{displayPrice}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
