"use client";

import { usePathname } from "next/navigation";

import { TopNav } from "./TopNav";

export function AppNav() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return <TopNav />;
}
