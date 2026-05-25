"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { SearchItem } from "@/lib/data/search-index";

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open || items.length || loadingRef.current) {
      return;
    }

    let cancelled = false;
    loadingRef.current = true;
    fetch("/search-index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((nextItems: SearchItem[]) => {
        if (!cancelled) {
          setItems(nextItems);
        }
      })
      .finally(() => {
        loadingRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [items.length, open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return items.slice(0, 10);
    }

    return items
      .map((item) => {
        const haystack = `${item.label} ${item.meta}`.toLowerCase();
        const index = haystack.indexOf(needle);
        return { item, score: index === -1 ? Number.POSITIVE_INFINITY : index };
      })
      .filter((entry) => Number.isFinite(entry.score))
      .sort((a, b) => a.score - b.score || a.item.label.localeCompare(b.item.label))
      .slice(0, 12)
      .map((entry) => entry.item);
  }, [items, query]);

  return (
    <div className="search-box">
      <button className="search-trigger" type="button" onClick={() => setOpen(true)}>
        <Search size={16} aria-hidden="true" />
        <span>Search companies and industries</span>
        <kbd>⌘K</kbd>
      </button>

      {open ? (
        <div className="search-popover">
          <div className="search-input-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Reliance, pharma, utilities..."
              aria-label="Search"
            />
            <button className="icon-button" type="button" onClick={() => setOpen(false)}>
              <X size={16} aria-hidden="true" />
              <span className="sr-only">Close search</span>
            </button>
          </div>
          <div className="search-results">
            {results.length ? (
              results.map((result) => (
                <Link
                  className="search-result"
                  href={result.href}
                  key={`${result.kind}-${result.href}`}
                  onClick={() => setOpen(false)}
                >
                  <span>
                    <span className="result-label">{result.label}</span>
                    <span className="result-meta"> {result.meta}</span>
                  </span>
                  <span className="count-badge">{result.kind}</span>
                </Link>
              ))
            ) : (
              <div className="empty-state">No matches</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
