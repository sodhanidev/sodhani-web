import Link from "next/link";
import Image from "next/image";
import { BarChart3 } from "lucide-react";

import { CommandSearch, type SearchItem } from "./CommandSearch";
import { companyHref, marketHref } from "@/lib/data/format";
import type { Company, IndustryNode } from "@/lib/data/types";

export function TopNav({
  companies,
  nodes
}: {
  companies: Company[];
  nodes: IndustryNode[];
}) {
  const companyItems: SearchItem[] = companies.map((company) => ({
    kind: "Company",
    label: company.name,
    meta: `${company.code} · ${company.leaf.name}`,
    href: companyHref(company.code)
  }));

  const industryItems: SearchItem[] = nodes.map((node) => ({
    kind: "Industry",
    label: node.name,
    meta: node.names.join(" / "),
    href: marketHref(node.path)
  }));

  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link className="brand" href="/">
          <Image
            className="brand-mark"
            src="/logo-transparent.png"
            alt="Sodhani"
            width={30}
            height={30}
            priority
          />
          <span>Sodhani</span>
        </Link>
        <CommandSearch items={[...companyItems, ...industryItems]} />
        <nav className="nav-links" aria-label="Primary navigation">
          <Link className="nav-link" href="/market/">
            <BarChart3 size={16} aria-hidden="true" />
            Market
          </Link>
        </nav>
      </div>
    </header>
  );
}
