import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { AppNav } from "@/components/AppNav";
import { TickerTape } from "@/components/TickerTape";

import "./globals.css";

const themeScript = `
(() => {
  const storageKey = "sodhani-theme";

  function readTheme() {
    try {
      const theme = window.localStorage.getItem(storageKey);
      return theme === "light" || theme === "dark" || theme === "system" ? theme : "light";
    } catch {
      return "light";
    }
  }

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function resolvedTheme(theme) {
    return theme === "system" ? systemTheme() : theme;
  }

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.themePreference = theme;
      return;
    }

    document.documentElement.dataset.theme = resolvedTheme(theme);
    document.documentElement.dataset.themePreference = "system";
  }

  function syncButtons(theme) {
    document.querySelectorAll("[data-theme-option]").forEach((button) => {
      const active = button.getAttribute("data-theme-option") === theme;
      button.setAttribute("aria-pressed", String(active));
      if (active) {
        button.setAttribute("data-active", "true");
      } else {
        button.removeAttribute("data-active");
      }
    });
  }

  try {
    applyTheme(readTheme());
  } catch {}

  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-theme-option]") : null;
    if (!button) {
      return;
    }

    const theme = button.getAttribute("data-theme-option");
    if (theme !== "light" && theme !== "dark" && theme !== "system") {
      return;
    }

    applyTheme(theme);
    syncButtons(theme);

    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {}
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => syncButtons(readTheme()), { once: true });
  } else {
    syncButtons(readTheme());
  }

  try {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if (readTheme() === "system") {
        applyTheme("system");
      }
    };

    if (media.addEventListener) {
      media.addEventListener("change", syncSystemTheme);
    } else if (media.addListener) {
      media.addListener(syncSystemTheme);
    }
  } catch {}
})();
`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={inter.variable}>
        <Script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          id="theme-preference"
          strategy="beforeInteractive"
        />
        <TickerTape />
        <AppNav />
        {children}
      </body>
    </html>
  );
}
