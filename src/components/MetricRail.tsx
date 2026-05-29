import Link from "next/link";
import { css } from "@/lib/css-module";
import styles from "./market.module.css";

import { companyHref, formatMetric } from "@/lib/data/format";
import type { Company } from "@/lib/data/types";

const labels = {
  marketCapCr: "Top market cap",
  rocePct: "Highest ROCE",
  profitVarPct: "Fastest profit growth"
} as const;

export function MetricRail({
  metric,
  companies
}: {
  metric: keyof typeof labels;
  companies: Company[];
}) {
  const kind = metric === "marketCapCr" ? "crore" : "percent";

  return (
    <section className={css(styles, "rail")}>
      <h2>{labels[metric]}</h2>
      <ol className={css(styles, "rail-list")}>
        {companies.map((company) => (
          <li key={`${metric}-${company.code}`}>
            <Link className={css(styles, "rail-row")} href={companyHref(company.code)}>
              <span className={css(styles, "rail-name")}>{company.name}</span>
              <span className={css(styles, "numeric")}>{formatMetric(company[metric], kind)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
