import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { css } from "@/lib/css-module";
import styles from "@/components/indices.module.css";
import { BreadthBar } from "@/components/BreadthBar";
import { IndexHeader } from "@/components/IndexHeader";
import { IndexHeatmap } from "@/components/IndexHeatmap";
import { SiteFooter } from "@/components/SiteFooter";
import { companyHref, formatIndianNumber } from "@/lib/data/format";
import { getIndexBySlug, getIndexSlugs } from "@/lib/data/indices-nse";

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getIndexSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const index = getIndexBySlug(slug);
  return {
    title: index ? `${index.label} — Index` : "Index",
    description: index
      ? `${index.label}: value, day move, breadth and constituent heatmap.`
      : "Market index."
  };
}

function signed(value: number | null, dp: number, suffix = "") {
  if (value === null || !Number.isFinite(value)) return "-";
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${formatIndianNumber(Math.abs(value), { dp })}${suffix}`;
}

export default async function IndexDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const index = getIndexBySlug(slug);

  if (!index) {
    notFound();
  }

  return (
    <main className={css(styles, "shell page-stack indices-scope")}>
      <div className={css(styles, "detail")}>
        <Link href="/market/" className={css(styles, "back")}>
          ← Market
        </Link>

        <IndexHeader index={index} />

        <section className={css(styles, "section")}>
          <h2 className={css(styles, "section-title")}>Market breadth</h2>
          <BreadthBar breadth={index.breadth} />
        </section>

        <section className={css(styles, "section")}>
          <h2 className={css(styles, "section-title")}>Heatmap</h2>
          <p className={css(styles, "section-lede")}>
            {formatIndianNumber(index.constituentCount)} constituents · sized by free-float market cap, coloured by day move.
          </p>
          <IndexHeatmap constituents={index.constituents} />
        </section>

        <section className={css(styles, "section")}>
          <h2 className={css(styles, "section-title")}>Constituents</h2>
          <div className={css(styles, "table-wrap")}>
            <table className={css(styles, "table")}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>LTP</th>
                  <th>Change %</th>
                  <th>52W High / Low</th>
                </tr>
              </thead>
              <tbody>
                {index.constituents.map((c) => {
                  const dir = (c.changePct ?? 0) >= 0 ? "up" : "down";
                  return (
                    <tr key={c.code}>
                      <td>
                        {c.hasPage ? <Link href={companyHref(c.code)}>{c.name}</Link> : c.name}
                      </td>
                      <td className={css(styles, "numeric num")}>{formatIndianNumber(c.ltp, { dp: 2 })}</td>
                      <td className={css(styles, `numeric num ${dir}`)}>{signed(c.changePct, 2, "%")}</td>
                      <td className={css(styles, "numeric num")}>
                        {formatIndianNumber(c.yearHigh, { dp: 2 })} / {formatIndianNumber(c.yearLow, { dp: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <SiteFooter className="footer-bleed" />
    </main>
  );
}
