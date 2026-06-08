import Link from "next/link";
import { ArrowUpRight, Bookmark } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./market.module.css";

import { CompanyLogoMark } from "@/components/CompanyLogoMark";
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
    <Link className={css(styles, "sector-card")} href={marketHref(node.path)}>
      <div className={css(styles, "sector-visual-head")}>
        <span className={css(styles, "theme-icon")} aria-hidden="true">
          {node.name.charAt(0)}
        </span>
        <ArrowUpRight className={css(styles, "sector-open-icon")} size={16} aria-hidden="true" />
        <h3>{node.name}</h3>
        <span className={css(styles, "count-badge")}>{formatIndianNumber(node.companyCount)} companies</span>
      </div>
      <ul className={css(styles, "mini-list")}>
        {leaders.map((company) => (
          <li key={`${node.code}-${company.code}`}>
            <span className={css(styles, "mini-company")}>
              <CompanyLogoMark code={company.code} name={company.name} size="sm" />
              <span>{company.name}</span>
            </span>
            <span className={css(styles, "numeric")}>{formatMetric(company.marketCapCr, "crore")}</span>
            <Bookmark className={css(styles, "mini-bookmark")} size={18} aria-hidden="true" />
          </li>
        ))}
      </ul>
    </Link>
  );
}
