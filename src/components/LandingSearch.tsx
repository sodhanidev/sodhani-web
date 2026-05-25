"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { companyHref } from "@/lib/data/format";
import type { Company } from "@/lib/data/types";

export function LandingSearch({
  companies,
  availableStockCodes
}: {
  companies: Company[];
  availableStockCodes: string[];
}) {
  const [query, setQuery] = useState("");
  const available = useMemo(() => new Set(availableStockCodes), [availableStockCodes]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return [];
    }

    return companies
      .filter((company) =>
        `${company.name} ${company.code}`.toLowerCase().includes(needle)
      )
      .slice(0, 8);
  }, [companies, query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = results[0];
    if (first && available.has(first.code)) {
      window.location.href = companyHref(first.code);
      return;
    }

    const value = encodeURIComponent(query.trim());
    if (value) {
      window.location.href = `/search/?q=${value}`;
    }
  }

  return (
    <form className="landing-search" onSubmit={submit}>
      <div className="landing-search-input">
        <Search size={28} aria-hidden="true" />
        <input
          aria-label="Search for a company"
          autoComplete="off"
          placeholder="Search for a company"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {results.length ? (
        <div className="landing-results">
          {results.map((company) => {
            const href = available.has(company.code)
              ? companyHref(company.code)
              : `/search/?q=${encodeURIComponent(company.name)}`;

            return (
              <Link className="landing-result" href={href} key={`${company.code}-${company.leaf.code}`}>
                <span>{company.name}</span>
                <span>{company.code}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </form>
  );
}
