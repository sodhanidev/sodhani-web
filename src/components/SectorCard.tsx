import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { formatIndianNumber, formatMetric, marketHref } from "@/lib/data/format";
import type { Company, IndustryNode } from "@/lib/data/types";

export function SectorCard({
  node,
  leaders
}: {
  node: IndustryNode;
  leaders: Company[];
}) {
  return (
    <Link className="sector-card" href={marketHref(node.path)}>
      <div className="sector-title-row">
        <h3>{node.name}</h3>
        <ArrowUpRight size={17} aria-hidden="true" />
      </div>
      <span className="count-badge">{formatIndianNumber(node.companyCount)} companies</span>
      <ul className="mini-list">
        {leaders.map((company) => (
          <li key={`${node.code}-${company.code}`}>
            <span>{company.name}</span>
            <span className="numeric">{formatMetric(company.marketCapCr, "crore")}</span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
