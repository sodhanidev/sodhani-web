"use client";

import { BarChart3, ChevronDown, Circle } from "lucide-react";
import { useState } from "react";

import { formatIndianNumber, marketHref } from "@/lib/data/format";
import type { Company, PricePoint, Stock } from "@/lib/data/types";

export function StockHeader({
  stock,
  company,
  prices,
  hasFullStockData = false
}: {
  stock: Stock;
  company?: Company;
  prices: PricePoint[];
  hasFullStockData?: boolean;
}) {
  const [exchange, setExchange] = useState<"NSE" | "BSE">("NSE");

  const latest = prices[prices.length - 1];
  const previous = prices[prices.length - 2];
  const nsePrice = latest?.close ?? company?.cmp ?? 0;
  const nseChange = latest && previous ? latest.close - previous.close : 0;
  const nsePct = previous ? (nseChange / previous.close) * 100 : 0;
  const price = nsePrice;
  const change = nseChange;
  const pct = nsePct;
  const positive = change >= 0;
  const hasChange = hasFullStockData && Boolean(latest && previous);
  const supportsExchangeToggle = hasFullStockData;

  const industryHref = company ? marketHref(company.leaf.code ? [
    company.sector.code,
    company.group.code,
    company.industry.code,
    company.leaf.code
  ] : []) : "/market/";

  return (
    <section className="stock-head">
      <div className="stock-logo" aria-hidden="true">
        <span>{stock.ticker.slice(0, 1)}</span>
      </div>
      <div className="stock-quote">
        <h1>{stock.overview.companyName}</h1>
        <div className="quote-controls">
          <div className={`ticker-select ${supportsExchangeToggle ? "" : "ticker-static"}`}>
            <span>{stock.ticker}</span>
            <span className="quote-dot">·</span>
            <span className="exchange-icon" aria-hidden="true">
              <BarChart3 size={18} />
            </span>
            <span>{supportsExchangeToggle ? exchange : "Listing"}</span>
            {supportsExchangeToggle ? (
              <>
                <span className="exchange-mini" aria-hidden="true">
                  <BarChart3 size={16} />
                </span>
                <ChevronDown size={18} aria-hidden="true" />
              </>
            ) : null}
          </div>
          {company ? (
            <a className="industry-chip" href={industryHref}>
              {company.leaf.name}
            </a>
          ) : null}
          {supportsExchangeToggle ? (
            <span className="market-status" title="Market status placeholder">
              <Circle size={12} fill="currentColor" aria-hidden="true" />
            </span>
          ) : null}
        </div>
        <div className="price-line">
          <span className="price-value">{formatIndianNumber(price, { dp: 2 })}</span>
          <span className="price-currency">INR</span>
          {hasChange ? (
            <span className={`numeric ${positive ? "up" : "down"}`}>
              {positive ? "+" : ""}
              {formatIndianNumber(change, { dp: 2 })} {positive ? "+" : ""}
              {formatIndianNumber(pct, { dp: 2 })}%
            </span>
          ) : (
            <span className="numeric muted">Change unavailable</span>
          )}
        </div>
        <p className="quote-time">
          {latest
            ? `As of ${latest.date}${supportsExchangeToggle ? ` · ${exchange}` : ""}`
            : "As of latest data"}
        </p>
      </div>

      {supportsExchangeToggle ? (
        <div className="exchange-toggle quote-exchange" aria-label="Exchange">
          {(["NSE", "BSE"] as const).map((candidate) => (
            <button
              className={candidate === exchange ? "active" : ""}
              key={candidate}
              type="button"
              onClick={() => setExchange(candidate)}
            >
              {candidate}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
