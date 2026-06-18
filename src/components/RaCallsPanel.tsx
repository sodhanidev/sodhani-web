import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { formatIndianNumber } from "@/lib/data/format";
import { RA_CALLS, raUpsidePct, type RaCall } from "@/lib/data/ra-calls";

function RaRow({ call }: { call: RaCall }) {
  const upside = raUpsidePct(call);
  const changeDir = call.changePct >= 0 ? "up" : "down";

  return (
    <li className={css(styles, "ra-row")}>
      <img
        className={css(styles, "ra-avatar")}
        src={call.photo}
        alt={call.analyst}
        width={36}
        height={36}
        loading="lazy"
      />
      <span className={css(styles, "ra-main")}>
        <span className={css(styles, "ra-analyst")}>{call.analyst}</span>
        <span className={css(styles, "ra-company")}>
          {call.company}
          <span className={css(styles, `ra-tag ${call.action.toLowerCase()}`)}>{call.action}</span>
        </span>
        <span className={css(styles, "ra-target")}>
          Target: {formatIndianNumber(call.target, { prefix: "₹" })} · Upside:{" "}
          {upside >= 0 ? "+" : "−"}
          {formatIndianNumber(Math.abs(upside), { dp: 1, suffix: "%" })}
        </span>
      </span>
      <span className={css(styles, "ra-side")}>
        <span className={css(styles, "ra-when")}>{call.when}</span>
        <span className={css(styles, "numeric ra-cmp")}>
          {formatIndianNumber(call.cmp, { dp: 2, prefix: "₹" })}
        </span>
        <span className={css(styles, `ra-change ${changeDir}`)}>
          <span aria-hidden="true">{changeDir === "up" ? "▲" : "▼"}</span>
          {formatIndianNumber(Math.abs(call.changePct), { dp: 2, suffix: "%" })}
        </span>
      </span>
    </li>
  );
}

// Top analyst calls, rendered as bento-tile content. Split out of MarketOverview.
export function RaCallsPanel() {
  return (
    <>
      <div className={css(styles, "bento-tile-head")}>
        <span className={css(styles, "bento-eyebrow")}>Top RA calls</span>
      </div>
      <ul className={css(styles, "ra-list")}>
        {RA_CALLS.map((call) => (
          <RaRow key={call.id} call={call} />
        ))}
      </ul>
    </>
  );
}
