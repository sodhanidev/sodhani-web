import type { Metadata } from "next";

import { AppNav } from "@/components/AppNav";
import { getCompanies } from "@/lib/data/companies";
import { getIndustryData } from "@/lib/data/industry";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sodhani",
  description: "Static Indian equity research browser powered by local Screener-style data.",
  icons: {
    icon: "/logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const companies = getCompanies();
  const nodes = [...getIndustryData().nodes.values()];

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AppNav companies={companies} nodes={nodes} />
        {children}
      </body>
    </html>
  );
}
