import Link from "next/link";

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
    <section className="rail">
      <h2>{labels[metric]}</h2>
      <ol className="rail-list">
        {companies.map((company) => (
          <li key={`${metric}-${company.code}`}>
            <Link className="rail-row" href={companyHref(company.code)}>
              <span className="rail-name">{company.name}</span>
              <span className="numeric">{formatMetric(company[metric], kind)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
