import { getSearchItems } from "@/lib/data/search-index";

export const dynamic = "force-static";

export function GET() {
  return Response.json(getSearchItems());
}
