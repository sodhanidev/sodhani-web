import { Suspense } from "react";

import { getCompanies } from "@/lib/data/companies";
import { getIndustryData } from "@/lib/data/industry";
import { getAvailableStockCodes } from "@/lib/data/stocks";
import { SearchResultsClient } from "@/components/SearchResultsClient";

export const metadata = {
  title: "Search"
};

export default function SearchPage() {
  const companies = getCompanies();
  const nodes = [...getIndustryData().nodes.values()];
  const availableStockCodes = getAvailableStockCodes();

  return (
    <main className="shell page-stack">
      <section className="node-head">
        <div>
          <div className="eyebrow">Search</div>
          <h1>Search</h1>
        </div>
      </section>
      <Suspense fallback={<div className="empty-state">Loading search</div>}>
        <SearchResultsClient
          availableStockCodes={availableStockCodes}
          companies={companies}
          nodes={nodes}
        />
      </Suspense>
    </main>
  );
}
