"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { SearchItem } from "@/lib/data/search-index";

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);

  const openSearch = useCallback(() => {
    if (!items.length && !loadingRef.current) {
      setLoading(true);
    }
    setOpen(true);
  }, [items.length]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open || items.length || loadingRef.current) {
      return;
    }

    let cancelled = false;
    loadingRef.current = true;
    setLoading(true);
    fetch("/search-index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((nextItems: SearchItem[]) => {
        if (!cancelled) {
          setItems(nextItems);
        }
      })
      .finally(() => {
        loadingRef.current = false;
        if (!cancelled) {
          setLoading(false);
        }
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
    <div className="search-box" ref={boxRef}>
      <div className={`search-trigger${open ? " active" : ""}`}>
        <Search size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            openSearch();
          }}
          onFocus={openSearch}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results[0]) {
              window.location.href = results[0].href;
            }
          }}
          placeholder="Search companies and industries"
          aria-label="Search companies and industries"
        />
        {query ? (
          <button
            className="search-clear"
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X size={15} aria-hidden="true" />
            <span className="sr-only">Clear search</span>
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="search-popover">
          <div className="search-results">
            {loading ? (
              <div className="search-loading" role="status" aria-label="Loading search results">
                <span className="search-loading-spinner" aria-hidden="true" />
                <span className="search-loading-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ) : results.length ? (
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
