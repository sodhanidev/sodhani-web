"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";

export function RailScroller({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) {
      return;
    }
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) {
      return;
    }
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = useCallback((direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) {
      return;
    }
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  }, []);

  return (
    <div className={css(styles, "dash-rail-wrap")}>
      <button
        type="button"
        aria-label="Scroll left"
        className={css(styles, `dash-rail-nav left${canLeft ? "" : " hidden"}`)}
        onClick={() => scrollBy(-1)}
        tabIndex={canLeft ? 0 : -1}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <div className={css(styles, "dash-stock-rail")} ref={trackRef}>
        {children}
      </div>
      <button
        type="button"
        aria-label="Scroll right"
        className={css(styles, `dash-rail-nav right${canRight ? "" : " hidden"}`)}
        onClick={() => scrollBy(1)}
        tabIndex={canRight ? 0 : -1}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
