import type { Config } from "tailwindcss";

// Scoped Tailwind for Tremor only. preflight is DISABLED so Tailwind never
// resets the existing global CSS / CSS Modules that drive the rest of the app.
const config: Config = {
  corePlugins: {
    preflight: false
  },
  content: [
    "./src/components/**/*.{ts,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx,mjs}"
  ],
  theme: {
    transparent: "transparent",
    current: "currentColor",
    extend: {
      colors: {
        // Map Tremor's semantic colors onto the app's landing tokens.
        tremor: {
          brand: { DEFAULT: "var(--link-blue)", emphasis: "var(--link-blue)" },
          background: { DEFAULT: "var(--landing-bg)", muted: "var(--landing-surface-soft)" },
          border: { DEFAULT: "var(--landing-line)" },
          content: {
            DEFAULT: "var(--landing-muted)",
            emphasis: "var(--landing-ink)",
            strong: "var(--landing-ink-strong)"
          }
        }
      },
      fontFamily: {
        mono: ["var(--font-mono)"]
      }
    }
  },
  plugins: []
};

export default config;
