import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";
import { formatIndianNumber } from "@/lib/data/format";
import { SPARK_H, SPARK_W, sparkPoints } from "@/lib/data/spark";
import {
  RA_CALLS,
  getMarketBreadth,
  raUpsidePct,
  type RaCall
} from "@/lib/data/ra-calls";

function RaRow({ call }: { call: RaCall }) {
  const upside = raUpsidePct(call);
  const changeDir = call.changePct >= 0 ? "up" : "down";

  return (
    <li className={css(styles, "ra-row")}>
      <span className={css(styles, `ra-avatar ${call.tone}`)} aria-hidden="true">
        {call.initials}
      </span>
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

export function MarketOverview() {
  const breadth = getMarketBreadth();
  const total = breadth.advances + breadth.unchanged + breadth.declines || 1;
  const advPct = (breadth.advances / total) * 100;
  const unchPct = (breadth.unchanged / total) * 100;
  const decPct = (breadth.declines / total) * 100;
  const vixDir = breadth.vixChangePct >= 0 ? "up" : "down";

  return (
    <section className={css(styles, "dash-section market-board")}>
      <div className={css(styles, "market-board-main")}>
        <div className={css(styles, "market-board-head")}>
          <h2 className={css(styles, "dash-section-title")}>Market overview</h2>
        </div>

        <div className={css(styles, "breadth-block")}>
          <div className={css(styles, "breadth-panel")}>
            <div className={css(styles, "breadth-main")}>
              <span className={css(styles, "breadth-heading")}>Market breadth</span>
              <div className={css(styles, "breadth-bar")} aria-hidden="true">
                <span className={css(styles, "breadth-seg adv")} style={{ width: `${advPct}%` }} />
                <span className={css(styles, "breadth-seg unch")} style={{ width: `${unchPct}%` }} />
                <span className={css(styles, "breadth-seg dec")} style={{ width: `${decPct}%` }} />
              </div>
              <div className={css(styles, "breadth-stats")}>
                <div className={css(styles, "breadth-stat")}>
                  <span className={css(styles, "numeric breadth-num adv")}>
                    {formatIndianNumber(breadth.advances)}
                  </span>
                  <span className={css(styles, "breadth-cap")}>Advances</span>
                </div>
                <div className={css(styles, "breadth-stat")}>
                  <span className={css(styles, "numeric breadth-num unch")}>
                    {formatIndianNumber(breadth.unchanged)}
                  </span>
                  <span className={css(styles, "breadth-cap")}>Unchanged</span>
                </div>
                <div className={css(styles, "breadth-stat")}>
                  <span className={css(styles, "numeric breadth-num dec")}>
                    {formatIndianNumber(breadth.declines)}
                  </span>
                  <span className={css(styles, "breadth-cap")}>Declines</span>
                </div>
              </div>
            </div>

            <div className={css(styles, "breadth-vix")}>
              <span className={css(styles, "breadth-vix-label")}>India VIX</span>
              <span className={css(styles, "numeric breadth-vix-val")}>
                {formatIndianNumber(breadth.vix, { dp: 2 })}
              </span>
              <span className={css(styles, `breadth-vix-change ${vixDir}`)}>
                <span aria-hidden="true">{vixDir === "up" ? "▲" : "▼"}</span>
                {formatIndianNumber(Math.abs(breadth.vixChangePct), { dp: 2, suffix: "%" })}
              </span>
              <svg
                className={css(styles, `breadth-vix-spark ${vixDir}`)}
                viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline points={sparkPoints(breadth.vixSpark)} fill="none" strokeWidth={1.75} />
              </svg>
            </div>
          </div>
          <p className={css(styles, "breadth-note")}>
            Breadth from latest quarterly profit growth across {formatIndianNumber(total)} companies.
          </p>
        </div>
      </div>

      <aside className={css(styles, "ra-col")}>
        <div className={css(styles, "dash-section-head")}>
          <h2 className={css(styles, "dash-section-title")}>Top RA calls</h2>
        </div>
        <ul className={css(styles, "ra-list")}>
          {RA_CALLS.map((call) => (
            <RaRow key={call.id} call={call} />
          ))}
        </ul>
      </aside>
    </section>
  );
}
