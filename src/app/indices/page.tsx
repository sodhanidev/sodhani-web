import type { Metadata } from "next";
import Link from "next/link";

import { css } from "@/lib/css-module";
import styles from "@/components/indices.module.css";
import { SiteFooter } from "@/components/SiteFooter";
import { formatIndianNumber } from "@/lib/data/format";
import { getAllIndices } from "@/lib/data/indices-nse";

export const metadata: Metadata = {
  title: "All Indices",
  description: "NSE indices: value, day move, 52-week high and low."
};

function signed(value: number | null, dp: number, suffix = "") {
  if (value === null || !Number.isFinite(value)) return "-";
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${formatIndianNumber(Math.abs(value), { dp })}${suffix}`;
}

export default function IndicesPage() {
  const indices = getAllIndices();

  return (
    <main className={css(styles, "shell page-stack indices-scope")}>
      <div className={css(styles, "detail")}>
        <section className={css(styles, "section")}>
          <h1>All Indices</h1>
          <div className={css(styles, "table-wrap")}>
            <table className={css(styles, "table")}>
              <thead>
                <tr>
                  <th>Index name</th>
                  <th>Market value</th>
                  <th>52W High</th>
                  <th>52W Low</th>
                </tr>
              </thead>
              <tbody>
                {indices.map((index) => {
                  const dir = (index.changePct ?? 0) >= 0 ? "up" : "down";
                  return (
                    <tr key={index.slug}>
                      <td>
                        <Link href={`/indices/${index.slug}/`}>{index.label}</Link>
                      </td>
                      <td className={css(styles, "numeric num")}>
                        {formatIndianNumber(index.value, { dp: 2 })}
                        <span className={css(styles, `idx-list-chg ${dir}`)}>
                          {signed(index.changePct, 2, "%")}
                        </span>
                      </td>
                      <td className={css(styles, "numeric num")}>
                        {formatIndianNumber(index.yearHigh, { dp: 2 })}
                      </td>
                      <td className={css(styles, "numeric num")}>
                        {formatIndianNumber(index.yearLow, { dp: 2 })}
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
