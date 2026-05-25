import { Suspense } from "react";

import { SearchResultsClient } from "@/components/SearchResultsClient";

export const metadata = {
  title: "Search"
};

export default function SearchPage() {
  return (
    <main className="shell page-stack">
      <section className="node-head">
        <div>
          <div className="eyebrow">Search</div>
          <h1>Search</h1>
        </div>
      </section>
      <Suspense fallback={<div className="empty-state">Loading search</div>}>
        <SearchResultsClient />
      </Suspense>
    </main>
  );
}
