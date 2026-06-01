import { redirect } from "next/navigation";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

export const metadata = {
  title: "Search"
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params?.q) ? params.q[0] : params?.q;
  const query = rawQuery?.trim();

  redirect(query ? `/?q=${encodeURIComponent(query)}` : "/");
}
