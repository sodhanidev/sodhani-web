"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { css } from "@/lib/css-module";
import { rankSearchItems } from "@/lib/search-match";
import styles from "./layout.module.css";

import type { SearchItem } from "@/lib/data/search-index";

function resultBadge(result: SearchItem) {
  if (result.kind === "Company") {
    return result.code ?? "";
  }

  return result.count ? `${result.count} stocks` : "Industry";
}

function resultMeta(result: SearchItem) {
  if (result.kind !== "Company" || !result.code) {
    return result.meta;
  }

  const codePrefix = `${result.code} · `;
  return result.meta.startsWith(codePrefix) ? result.meta.slice(codePrefix.length) : result.meta;
}

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

    return rankSearchItems(items, needle).slice(0, 12);
  }, [items, query]);

  return (
    <div className={css(styles, "search-box")} ref={boxRef}>
      <div className={css(styles, `search-trigger${open ? " active" : ""}`)}>
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
            className={css(styles, "search-clear")}
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X size={15} aria-hidden="true" />
            <span className={css(styles, "sr-only")}>Clear search</span>
          </button>
        ) : null}
      </div>

      {open ? (
        <div className={css(styles, "search-popover")}>
          <div className={css(styles, "search-results")}>
            {loading ? (
              <div className={css(styles, "search-loading")} role="status" aria-label="Loading search results">
                <span className={css(styles, "search-loading-spinner")} aria-hidden="true" />
                <span className={css(styles, "search-loading-lines")} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ) : results.length ? (
              results.map((result) => (
                <Link
                  className={css(styles, "search-result")}
                  href={result.href}
                  key={`${result.kind}-${result.href}`}
                  onClick={() => setOpen(false)}
                >
                  <span>
                    <span className={css(styles, "result-label")}>{result.label}</span>
                    <span className={css(styles, "result-meta")}> {resultMeta(result)}</span>
                  </span>
                  <span className={css(styles, "count-badge")}>{resultBadge(result)}</span>
                </Link>
              ))
            ) : (
              <div className={css(styles, "empty-state")}>No matches</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
