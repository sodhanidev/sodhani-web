export default function MarketLoading() {
  return (
    <main className="shell page-stack market-page-shell" aria-label="Loading market">
      <section className="node-head market-loading-head">
        <div>
          <div className="skeleton-line skeleton-eyebrow" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-lede" />
        </div>
      </section>
      <div className="grid sector-grid" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <section className="sector-card market-loading-card" key={index}>
            <div className="sector-title-row">
              <span className="skeleton-line skeleton-card-title" />
              <span className="skeleton-dot" />
            </div>
            <span className="skeleton-line skeleton-badge" />
            <div className="market-loading-list">
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
