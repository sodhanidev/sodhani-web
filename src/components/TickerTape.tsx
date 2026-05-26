import Link from "next/link";

import { getCompanies } from "@/lib/data/companies";
import { companyHref, formatIndianNumber } from "@/lib/data/format";
import type { Company } from "@/lib/data/types";

function getTickerCompanies() {
  const eligible = getCompanies()
    .filter(
      (company) =>
        company.cmp !== null &&
        company.profitVarPct !== null &&
        company.marketCapCr !== null
    );

  const movers = eligible
    .filter(
      (company) =>
        Math.abs(company.profitVarPct ?? 0) >= 2 &&
        Math.abs(company.profitVarPct ?? 0) <= 15
    )
    .sort(
      (a, b) =>
        Math.abs(b.profitVarPct ?? 0) - Math.abs(a.profitVarPct ?? 0) ||
        (b.marketCapCr ?? 0) - (a.marketCapCr ?? 0)
    )
    .slice(0, 14);

  const flat = eligible
    .filter((company) => company.profitVarPct === 0)
    .sort((a, b) => (b.marketCapCr ?? 0) - (a.marketCapCr ?? 0))
    .slice(0, 2);

  return [...movers, ...flat];
}

function tickerLabel(company: Company): string {
  if (/[A-Z]/u.test(company.code)) {
    return company.code.toUpperCase();
  }

  const initials = company.name
    .split(/[\s.]+/u)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials.slice(0, 8) || company.code;
}

function TickerTapeItem({ company }: { company: Company }) {
  const change = company.profitVarPct ?? 0;
  const trend = change > 0 ? "up" : change < 0 ? "down" : "flat";

  return (
    <Link
      className="market-ticker-item"
      href={companyHref(company.code)}
      title={`${company.name} · Quarter profit variation`}
    >
      <span className="ticker-name">{tickerLabel(company)}</span>
      <span className="ticker-price numeric">
        {formatIndianNumber(company.cmp, { dp: 2 })}
      </span>
      <span className={`ticker-change numeric ${trend}`}>
        <span className="ticker-change-icon" aria-hidden="true" />
        {formatIndianNumber(Math.abs(change), { dp: 1 })}%
      </span>
    </Link>
  );
}

export function TickerTape() {
  const companies = getTickerCompanies();
  const loop = [...companies, ...companies];

  if (!companies.length) {
    return null;
  }

  return (
    <section
      className="market-ticker"
      aria-label="Market ticker showing company prices and quarterly profit variation"
    >
      <div className="market-ticker-window">
        <div className="market-ticker-loop">
          {loop.map((company, index) => (
            <TickerTapeItem company={company} key={`${company.code}-${index}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
