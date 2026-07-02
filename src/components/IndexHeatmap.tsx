import Link from "next/link";

import { css } from "@/lib/css-module";
import styles from "./indices.module.css";
import { companyHref } from "@/lib/data/format";
import type { IndexConstituent } from "@/lib/data/indices-nse";

// Move (in %) at which a tile reaches full colour intensity.
const INTENSITY_CAP = 3;

function signedPct(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "–";
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

// Background mixed off --up/--down by move size; flatter moves stay near
// surface, deeper moves saturate. Kept inline because it is data-derived.
function tileBackground(changePct: number | null): string {
  if (changePct === null || !Number.isFinite(changePct) || changePct === 0) {
    return "var(--surface)";
  }
  const token = changePct > 0 ? "var(--up)" : "var(--down)";
  const intensity = Math.min(Math.abs(changePct) / INTENSITY_CAP, 1);
  const mix = Math.round(14 + intensity * 56);
  return `color-mix(in srgb, ${token} ${mix}%, var(--surface))`;
}

// Tiles sized by free-float mcap (flex-grow off ffmc share) and coloured by
// move. hasPage constituents link to their company page.
export function IndexHeatmap({ constituents }: { constituents: IndexConstituent[] }) {
  const maxFfmc = Math.max(1, ...constituents.map((c) => c.ffmc ?? 0));

  return (
    <div className={css(styles, "heatmap")}>
      {constituents.map((c) => {
        // Square-root keeps the largest caps from dwarfing everything.
        const weight = Math.sqrt((c.ffmc ?? 0) / maxFfmc) || 0.15;
        const style = { flexGrow: weight, flexBasis: `${58 + weight * 90}px`, background: tileBackground(c.changePct) };
        const inner = (
          <>
            <span className={css(styles, "tile-code")}>{c.code}</span>
            <span className={css(styles, "numeric tile-pct")}>{signedPct(c.changePct)}</span>
          </>
        );
        return c.hasPage ? (
          <Link key={c.code} href={companyHref(c.code)} className={css(styles, "tile")} style={style} title={c.name}>
            {inner}
          </Link>
        ) : (
          <div key={c.code} className={css(styles, "tile")} style={style} title={c.name}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
