"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { css } from "@/lib/css-module";
import styles from "./LandingSearch.module.css";

import type { SearchItem } from "@/lib/data/search-index";

export function LandingSearch() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!query.trim() || items.length || loadingRef.current) {
      return;
    }

    let cancelled = false;
    loadingRef.current = true;
    fetch("/search-index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((nextItems: SearchItem[]) => {
        if (!cancelled) {
          setItems(nextItems.filter((item) => item.kind === "Company"));
        }
      })
      .finally(() => {
        loadingRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [items.length, query]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return [];
    }

    return items
      .filter((item) => `${item.label} ${item.code ?? ""}`.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [items, query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = results[0];
    if (first) {
      window.location.href = first.href;
      return;
    }

    const value = encodeURIComponent(query.trim());
    if (value) {
      window.location.href = `/search/?q=${value}`;
    }
  }

  return (
    <form className={css(styles, "landing-search")} onSubmit={submit}>
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
      {results.length ? (
        <div className={css(styles, "landing-results")}>
          {results.map((item) => (
            <Link
              className={css(styles, "landing-result")}
              href={item.href}
              key={item.href}
            >
              <span>{item.label}</span>
              <span>{item.code}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </form>
  );
}
