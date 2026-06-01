"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { css } from "@/lib/css-module";
import { rankSearchItems } from "@/lib/search-match";
import styles from "./LandingSearch.module.css";

import type { SearchItem } from "@/lib/data/search-index";

type LandingSearchProps = {
  initialQuery?: string;
};

export function LandingSearch({ initialQuery = "" }: LandingSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!query.trim() || items.length || loadingRef.current) {
      return;
    }

    let cancelled = false;
    loadingRef.current = true;
    setLoading(true);
    fetch("/search-index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((nextItems: SearchItem[]) => {
        if (!cancelled) {
          setItems(nextItems.filter((item) => item.kind === "Company"));
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setLoaded(true);
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
  }, [items.length, query]);

  const trimmedQuery = query.trim();

  const results = useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }

    return rankSearchItems(items, trimmedQuery).slice(0, 8);
  }, [items, trimmedQuery]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = results[0];
    if (first) {
      window.location.href = first.href;
    }
  }

  const showResults = Boolean(trimmedQuery);
  const showNoResults = showResults && loaded && !loading && results.length === 0;

  return (
    <form className={css(styles, `landing-search${showResults ? " open" : ""}`)} onSubmit={submit}>
      <div className={css(styles, "landing-search-input")}>
        <Search size={28} aria-hidden="true" />
        <input
          aria-label="Search for a company"
          autoComplete="off"
          placeholder="Search for a company"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {showResults ? (
        <div className={css(styles, "landing-results")}>
          {loading && !loaded ? (
            <div className={css(styles, "landing-search-status")}>Searching</div>
          ) : null}

          {results.map((item) => (
            <Link className={css(styles, "landing-result")} href={item.href} key={item.href}>
              <span>{item.label}</span>
              <span>{item.code}</span>
            </Link>
          ))}

          {showNoResults ? (
            <div className={css(styles, "landing-search-status")}>
              No results for <strong>{trimmedQuery}</strong>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
