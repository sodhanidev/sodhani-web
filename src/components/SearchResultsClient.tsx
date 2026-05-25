"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { SearchItem } from "@/lib/data/search-index";

export function SearchResultsClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const needle = q.toLowerCase();
  const [items, setItems] = useState<SearchItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/search-index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((nextItems: SearchItem[]) => {
        if (!cancelled) {
          setItems(nextItems);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const companyResults = useMemo(
    () =>
      needle
        ? items
            .filter(
              (item) =>
                item.kind === "Company" &&
                `${item.label} ${item.code ?? ""} ${item.meta}`.toLowerCase().includes(needle)
            )
            .slice(0, 30)
        : [],
    [items, needle]
  );

  const industryResults = useMemo(
    () =>
      needle
        ? items
            .filter(
              (item) =>
                item.kind === "Industry" &&
                `${item.label} ${item.code ?? ""} ${item.meta}`.toLowerCase().includes(needle)
            )
            .slice(0, 20)
        : [],
    [items, needle]
  );

  return (
    <section className="grid rails-grid">
      <div className="panel panel-pad">
        <h2>Companies</h2>
        <ul className="rail-list">
          {companyResults.map((item) => (
            <li key={item.href}>
              <Link className="rail-row" href={item.href}>
                <span className="rail-name">{item.label}</span>
                <span className="count-badge">{item.code}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel panel-pad">
        <h2>Industries</h2>
        <ul className="rail-list">
          {industryResults.map((item) => (
            <li key={item.href}>
              <Link className="rail-row" href={item.href}>
                <span className="rail-name">{item.label}</span>
                <span className="count-badge">{item.count ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
