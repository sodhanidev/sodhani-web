"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { companyHref, formatMetric } from "@/lib/data/format";
import type { Company } from "@/lib/data/types";

type SortKey =
  | "name"
  | "cmp"
  | "pe"
  | "marketCapCr"
  | "divYieldPct"
  | "npQtrCr"
  | "profitVarPct"
  | "salesQtrCr"
  | "salesVarPct"
  | "rocePct";

type Column = {
  key: SortKey;
  label: string;
  className?: string;
  kind: "text" | "currency" | "number" | "percent" | "crore";
};

const columns: Column[] = [
  { key: "name", label: "Company", className: "col-core", kind: "text" },
  { key: "cmp", label: "CMP", className: "col-core", kind: "currency" },
  { key: "pe", label: "P/E", className: "col-optional", kind: "number" },
  { key: "marketCapCr", label: "Mkt Cap", className: "col-core", kind: "crore" },
  { key: "divYieldPct", label: "Div Yld", className: "col-extended", kind: "percent" },
  { key: "npQtrCr", label: "NP Qtr", className: "col-extended", kind: "crore" },
  { key: "profitVarPct", label: "Profit Var", className: "col-optional", kind: "percent" },
  { key: "salesQtrCr", label: "Sales Qtr", className: "col-core", kind: "crore" },
  { key: "salesVarPct", label: "Sales Var", className: "col-optional", kind: "percent" },
  { key: "rocePct", label: "ROCE", className: "col-extended", kind: "percent" }
];

function sortValue(company: Company, key: SortKey): string | number {
  if (key === "name") {
    return company.name;
  }
  return company[key] ?? Number.NEGATIVE_INFINITY;
}

function valueClass(key: SortKey, company: Company): string {
  if (key === "profitVarPct" || key === "salesVarPct") {
    const value = company[key];
    if (value === null) {
      return "";
    }
    return value >= 0 ? "up" : "down";
  }
  return "";
}

export function MarketTable({
  companies,
  initialPage = 1,
  pageSize = 25
}: {
  companies: Company[];
  initialPage?: number;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("marketCapCr");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(initialPage);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source = needle
      ? companies.filter((company) =>
          `${company.name} ${company.code}`.toLowerCase().includes(needle)
        )
      : companies;

    return [...source].sort((a, b) => {
      const aValue = sortValue(a, sortKey);
      const bValue = sortValue(b, sortKey);
      const result =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue));
      return direction === "asc" ? result : -result;
    });
  }, [companies, direction, query, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  function cycleSort(key: SortKey) {
    if (key === sortKey) {
      setDirection(direction === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setDirection(key === "name" ? "asc" : "desc");
    }
    setPage(1);
  }

  return (
    <section className="panel">
      <div className="table-toolbar">
        <input
          className="text-input"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Filter company or code"
          aria-label="Filter companies"
        />
        <span className="muted numeric">
          {filtered.length.toLocaleString("en-IN")} rows · showing {start + 1}-
          {Math.min(start + pageSize, filtered.length)}
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              {columns.map((column) => (
                <th className={column.className} key={column.key}>
                  <button className="sort-button" type="button" onClick={() => cycleSort(column.key)}>
                    {column.label}
                    {sortKey === column.key ? (
                      direction === "asc" ? (
                        <ArrowUp size={13} aria-hidden="true" />
                      ) : (
                        <ArrowDown size={13} aria-hidden="true" />
                      )
                    ) : (
                      <ChevronsUpDown size={13} aria-hidden="true" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((company, index) => (
              <tr
                key={`${company.code}-${company.leaf.code}`}
                tabIndex={0}
                onClick={() => {
                  window.location.href = companyHref(company.code);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    window.location.href = companyHref(company.code);
                  }
                }}
              >
                <td className="numeric">{start + index + 1}.</td>
                {columns.map((column) => (
                  <td
                    className={`${column.className ?? ""} ${valueClass(column.key, company)}`}
                    key={column.key}
                  >
                    {column.kind === "text" ? (
                      <a href={companyHref(company.code)} onClick={(event) => event.stopPropagation()}>
                        {company.name}
                      </a>
                    ) : (
                      <span className="numeric">
                        {formatMetric(company[column.key] as number | null, column.kind)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="muted numeric">
          {companies.length.toLocaleString("en-IN")} in category
        </span>
        <div className="pagination-pages" aria-label="Pagination">
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((pageNumber) => {
              return (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                Math.abs(pageNumber - currentPage) <= 2
              );
            })
            .map((pageNumber) => (
              <button
                className={pageNumber === currentPage ? "active" : ""}
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
        </div>
      </div>
    </section>
  );
}
