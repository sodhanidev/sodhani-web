import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { companyHref, formatIndianNumber } from "@/lib/data/format";
import { RESEARCH_REPORTS } from "@/lib/data/home-tables";
import { NewsPanel } from "./NewsPanel";

// Brokerage / research reports - paired with the market news panel below Market today.
function withoutYear(date: string) {
  return date.replace(/\s+\d{4}$/, "");
}

export function ResearchReports() {
  return (
    <section className={css(styles, "dash-section dash-section-flush")}>
      <div className={css(styles, "reports-layout")}>
        <div className={css(styles, "reports-main")}>
          <div className={css(styles, "dash-section-head")}>
            <h2 className={css(styles, "dash-section-title")}>
              <FileText size={18} aria-hidden="true" />
              Brokerage &amp; research reports
            </h2>
            <Link className={css(styles, "dash-view-all")} href="/market/">
              View all
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div className={css(styles, "reports-table")} role="table">
            <div className={css(styles, "reports-row reports-head")} role="row">
              <span role="columnheader">Company</span>
              <span role="columnheader">Action</span>
              <span className={css(styles, "reports-num")} role="columnheader">
                Target
              </span>
              <span role="columnheader">Broker</span>
              <span role="columnheader">Date</span>
              <span className={css(styles, "reports-doc-col")} role="columnheader">
                Report
              </span>
            </div>

            {RESEARCH_REPORTS.slice(0, 4).map((report) => (
              <div key={report.id} className={css(styles, "reports-row")} role="row">
                <Link href={companyHref(report.code)} className={css(styles, "reports-company")}>
                  {report.company}
                </Link>
                <span className={css(styles, `reports-action ${report.action === "Sell" ? "down" : "up"}`)}>
                  {report.action}
                </span>
                <span className={css(styles, "numeric reports-num")}>
                  {formatIndianNumber(report.target, { dp: 2 })}
                </span>
                <span className={css(styles, "reports-broker")}>{report.broker}</span>
                <span className={css(styles, "reports-date")}>{withoutYear(report.date)}</span>
                <span className={css(styles, "reports-doc-col")}>
                  <span className={css(styles, "reports-doc")} aria-label="PDF report">
                    <FileText size={15} aria-hidden="true" />
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className={css(styles, "bento-tile reports-news")}>
          <NewsPanel />
        </aside>
      </div>
    </section>
  );
}
