import { MarketTable } from "./MarketTable";
import type { Company } from "@/lib/data/types";

type MarketTableProps = {
  companies: Company[];
  initialPage?: number;
  pageSize?: number;
};

export function LazyMarketTable(props: MarketTableProps) {
  return <MarketTable {...props} />;
}
