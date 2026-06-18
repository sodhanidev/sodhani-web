"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Globe, Layers, Factory, FlaskConical } from "lucide-react";

import { css } from "@/lib/css-module";
import { companyHref, formatIndianNumber, marketHref } from "@/lib/data/format";
import type { Company, IndustryNode } from "@/lib/data/types";
import { COMPANY_LOGO_CODES } from "../company-logos";
import styles from "./company.module.css";

// One icon per hierarchy depth: sector → group → industry → leaf.
const CRUMB_ICONS: ComponentType<{ size?: number; "aria-hidden"?: boolean }>[] = [
  Globe,
  Layers,
  Factory,
  FlaskConical
];

function stockInitial(company: Company): string {
  const match = company.name.match(/[A-Za-z0-9]/u);
  return (match?.[0] ?? company.code[0] ?? "S").toUpperCase();
}

function changeTone(value: number | null): "is-up" | "is-down" | "is-flat" {
  if (value === null || value === 0) {
    return "is-flat";
  }

  return value > 0 ? "is-up" : "is-down";
}

function formatChange(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${value > 0 ? "+" : ""}${formatIndianNumber(value, { dp: 2 })}%`;
}

export function RelatedStocks({
  peers,
  source,
  ticker
}: {
  peers: Company[];
  source?: IndustryNode;
  ticker: string;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const firstCard = rail.querySelector("a");
    const startScrollLeft = firstCard instanceof HTMLElement ? firstCard.offsetLeft - rail.offsetLeft : 0;

    setCanScrollBack(rail.scrollLeft > startScrollLeft + 2);
    setCanScrollForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    updateScrollState();
    rail.addEventListener("scroll", updateScrollState, { passive: true });

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScrollState);
      return () => {
        rail.removeEventListener("scroll", updateScrollState);
        window.removeEventListener("resize", updateScrollState);
      };
    }

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(rail);
    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollRelatedStocks = (direction: "back" | "forward") => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const distance = Math.max(260, rail.clientWidth * 0.82);
    rail.scrollBy({ left: direction === "forward" ? distance : -distance, behavior: "smooth" });
  };

  if (!peers.length) {
    return null;
  }

  return (
    <section className={css(styles, "related-stocks")} aria-labelledby="related-stocks-title">
      <div className={css(styles, "related-stocks-head")}>
        <h2 id="related-stocks-title">Peer Comparison</h2>
        {source && source.names.length ? (
          <nav className={css(styles, "peer-breadcrumb")} aria-label="Sector hierarchy">
            {source.names.map((name, i) => {
              const Icon = CRUMB_ICONS[i] ?? CRUMB_ICONS[CRUMB_ICONS.length - 1];

              return (
                <span className={css(styles, "peer-crumb-item")} key={source.path[i] ?? name}>
                  {i > 0 ? (
                    <ChevronRight className={css(styles, "peer-crumb-sep")} size={14} aria-hidden="true" />
                  ) : null}
                  <Link className={css(styles, "peer-crumb")} href={marketHref(source.path.slice(0, i + 1))}>
                    <Icon size={15} aria-hidden={true} />
                    {name}
                  </Link>
                </span>
              );
            })}
          </nav>
        ) : (
          <p>
            Compare {ticker} with peers from {source?.name ?? "the same category"}.
          </p>
        )}
      </div>
      <div className={css(styles, "related-stock-carousel")}>
        <div className={css(styles, "related-stock-rail")} ref={railRef}>
          {peers.map((company) => {
            const tone = changeTone(company.profitVarPct);

            return (
              <Link
                className={css(styles, "related-stock-card")}
                href={companyHref(company.code)}
                key={`${company.code}-${company.leaf.code}`}
              >
                <span className={css(styles, "related-stock-top")}>
                  {COMPANY_LOGO_CODES.has(company.code.toUpperCase()) ? (
                    <img
                      className={css(styles, "related-stock-logo related-stock-logo-img")}
                      src={`/logos/${company.code.toUpperCase()}.svg`}
                      alt={`${company.name} logo`}
                      width={36}
                      height={36}
                      loading="lazy"
                    />
                  ) : (
                    <span className={css(styles, "related-stock-logo")} aria-hidden="true">
                      {stockInitial(company)}
                    </span>
                  )}
                  <span className={css(styles, "related-stock-copy")}>
                    <span>
                      <strong>{company.name}</strong>
                      <em aria-hidden="true" />
                    </span>
                    <small>{company.code.toUpperCase()}</small>
                  </span>
                </span>
                <span className={css(styles, "related-stock-market")}>
                  <span className={css(styles, "related-stock-price numeric")}>
                    ₹ {formatIndianNumber(company.cmp, { dp: 2 })}
                  </span>
                  <span className={css(styles, `related-stock-change numeric ${tone}`)}>
                    {formatChange(company.profitVarPct)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        <button
          aria-label="Scroll peers left"
          className={css(styles, "related-stock-scroll-button is-left")}
          disabled={!canScrollBack}
          type="button"
          onClick={() => scrollRelatedStocks("back")}
        >
          <ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <button
          aria-label="Scroll peers right"
          className={css(styles, "related-stock-scroll-button is-right")}
          disabled={!canScrollForward}
          type="button"
          onClick={() => scrollRelatedStocks("forward")}
        >
          <ChevronRight size={22} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
