import { css } from "@/lib/css-module";
import styles from "@/components/market.module.css";

export default function MarketLoading() {
  return (
    <main className={css(styles, "shell page-stack market-page-shell")} aria-label="Loading market">
      <section className={css(styles, "node-head market-loading-head")}>
        <div>
          <div className={css(styles, "skeleton-line skeleton-eyebrow")} />
          <div className={css(styles, "skeleton-line skeleton-title")} />
          <div className={css(styles, "skeleton-line skeleton-lede")} />
        </div>
      </section>
      <div className={css(styles, "grid sector-grid")} aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <section className={css(styles, "sector-card market-loading-card")} key={index}>
            <div className={css(styles, "sector-title-row")}>
              <span className={css(styles, "skeleton-line skeleton-card-title")} />
              <span className={css(styles, "skeleton-dot")} />
            </div>
            <span className={css(styles, "skeleton-line skeleton-badge")} />
            <div className={css(styles, "market-loading-list")}>
              <span className={css(styles, "skeleton-line")} />
              <span className={css(styles, "skeleton-line")} />
              <span className={css(styles, "skeleton-line")} />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
