import Link from "next/link";
import { ChartPie, ChevronRight, Factory, Globe2, Wrench } from "lucide-react";

import { marketHref } from "@/lib/data/format";
import type { IndustryNode } from "@/lib/data/types";

const crumbIcons = [Globe2, ChartPie, Factory, Wrench];

export function Breadcrumbs({
  node,
  title,
  variant = "default"
}: {
  node?: IndustryNode;
  title?: string;
  variant?: "default" | "peer";
}) {
  return (
    <section className={`breadcrumb-block ${variant === "peer" ? "breadcrumb-peer" : ""}`}>
      {title ? <h2 className="breadcrumb-title">{title}</h2> : null}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        {node ? null : <Link href="/market/">Industries</Link>}
        {node?.path.map((code, index) => {
          const path = node.path.slice(0, index + 1);
          const label = node.names[index];
          const current = index === node.path.length - 1;
          const Icon = crumbIcons[index] ?? Globe2;

          return (
            <span className="breadcrumb-segment" key={code}>
              {index > 0 ? <ChevronRight className="breadcrumb-chevron" size={18} aria-hidden="true" /> : null}
              <Icon className="breadcrumb-icon" size={18} aria-hidden="true" />
              {current ? (
                <span>{label}</span>
              ) : (
                <Link href={marketHref(path)}>{label}</Link>
              )}
            </span>
          );
        })}
      </nav>
    </section>
  );
}
