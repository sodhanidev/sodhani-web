import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./page.module.css";

import { LandingSearch } from "@/components/LandingSearch";
import { SiteFooter } from "@/components/SiteFooter";

type MarketSnapshot = {
  label: string;
  value: string;
  change: string;
  direction: "up" | "down";
  points: number[];
};

const marketSnapshots: MarketSnapshot[][] = [
  [
    {
      label: "NIFTY 50",
      value: "23,907.90",
      change: "0.00%",
      direction: "up",
      points: [82, 44, 76, 30, 58, 36, 49, 42, 54]
    },
    {
      label: "USD/INR",
      value: "95.73",
      change: "0.34%",
      direction: "down",
      points: [43, 40, 49, 36, 45, 38, 31, 33, 28]
    },
    {
      label: "Gold",
      value: "16,099.85",
      change: "0.01%",
      direction: "up",
      points: [31, 31, 31, 31, 66, 66, 66, 72, 69, 26]
    }
  ],
  [
    {
      label: "NIFTY 100\nLargecap",
      value: "24,972.40",
      change: "0.01%",
      direction: "up",
      points: [74, 52, 82, 33, 69, 36, 58, 41, 48]
    },
    {
      label: "NIFTY 100\nMidcap",
      value: "62,537.90",
      change: "0.03%",
      direction: "down",
      points: [68, 53, 61, 32, 44, 25, 39, 35, 48]
    },
    {
      label: "NIFTY 100\nSmallcap",
      value: "18,396.15",
      change: "0.56%",
      direction: "up",
      points: [58, 35, 68, 28, 62, 32, 51, 38, 44]
    }
  ],
  [
    {
      label: "NIFTY Bank",
      value: "55,058.95",
      change: "0.37%",
      direction: "up",
      points: [78, 52, 42, 31, 56, 34, 40, 64]
    },
    {
      label: "NIFTY IT",
      value: "29,609.85",
      change: "2.43%",
      direction: "up",
      points: [48, 34, 43, 32, 49, 42, 56, 61]
    },
    {
      label: "NIFTY\nPharma",
      value: "24,695.15",
      change: "0.08%",
      direction: "down",
      points: [62, 38, 56, 31, 44, 34, 22, 28]
    }
  ]
];

function sparklinePath(points: number[]): string {
  const width = 96;
  const height = 34;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function MarketSparkline({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <svg className={css(styles, "landing-market-sparkline")} viewBox="0 0 112 34" aria-hidden="true">
      <line className={css(styles, "landing-market-sparkline-base")} x1="0" x2="112" y1="18" y2="18" />
      <path className={css(styles, `landing-market-sparkline-line ${snapshot.direction}`)} d={sparklinePath(snapshot.points)} />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className={css(styles, "landing-page")}>
      <section className={css(styles, "landing-hero")}>
        <nav className={css(styles, "landing-nav")} aria-label="Landing navigation">
          <div className={css(styles, "landing-links")}>
            <Link href="/">Home</Link>
            <Link href="/market/">Screens</Link>
            <Link href="/market/">
              Tools <ChevronDown size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className={css(styles, "landing-actions")}>
            <Link className={css(styles, "landing-login")} href="/sign-in/">
              <span className={css(styles, "landing-action-icon")} data-icon="user-round" aria-hidden="true" />
              Login
            </Link>
            <Link className={css(styles, "landing-account")} href="/sign-up/">
              <span className={css(styles, "landing-action-icon")} data-icon="user-plus" aria-hidden="true" />
              Sign up
            </Link>
          </div>
        </nav>

        <div className={css(styles, "landing-center")}>
          <h1 className={css(styles, "landing-logo")}>
            <Image
              className={css(styles, "landing-logo-img")}
              src="/logo-transparent.png"
              alt=""
              width={88}
              height={86}
              priority
            />
            <span>sodhani</span>
          </h1>
          <p>Stock analysis and screening tool for investors in India.</p>
          <LandingSearch />

          <section className={css(styles, "landing-market")} aria-labelledby="landing-market-title">
            <div className={css(styles, "landing-market-head")}>
              <h2 id="landing-market-title">Market and sectors</h2>
              <Link href="/market/">
                See All
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            <div className={css(styles, "landing-market-grid")}>
              {marketSnapshots.map((column, columnIndex) => (
                <div className={css(styles, "landing-market-column")} key={`market-column-${columnIndex}`}>
                  {column.map((snapshot) => (
                    <div className={css(styles, "landing-market-row")} key={snapshot.label}>
                      <span className={css(styles, "landing-market-name")}>
                        {snapshot.label.split("\n").map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </span>
                      <MarketSparkline snapshot={snapshot} />
                      <span className={css(styles, "landing-market-quote")}>
                        <span className={css(styles, "numeric landing-market-value")}>{snapshot.value}</span>
                        <span className={css(styles, `landing-market-change ${snapshot.direction}`)}>
                          <span aria-hidden="true">{snapshot.direction === "up" ? "▲" : "▼"}</span>
                          {snapshot.change}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
