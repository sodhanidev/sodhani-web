"use client";

import { usePathname } from "next/navigation";

import { TopNav } from "./TopNav";
import type { Company, IndustryNode } from "@/lib/data/types";

export function AppNav({
  companies,
  nodes
}: {
  companies: Company[];
  nodes: IndustryNode[];
}) {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return <TopNav companies={companies} nodes={nodes} />;
}
