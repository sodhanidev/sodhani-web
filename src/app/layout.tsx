import type { Metadata } from "next";

import { AppNav } from "@/components/AppNav";

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
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
