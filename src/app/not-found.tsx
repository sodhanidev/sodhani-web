import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell page-stack">
      <section className="empty-state">
        <h1>Not found</h1>
        <p>The requested page is not available in the local dataset.</p>
        <Link className="pill-button" href="/market/">
          Open market
        </Link>
      </section>
    </main>
  );
}
