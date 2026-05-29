import type { Metadata } from "next";
import Link from "next/link";
import { css } from "@/lib/css-module";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy · Sodhani",
  description:
    "How Sodhani Capital handles information collected through our research and screening tools."
};

const LAST_UPDATED = "May 26, 2026";

export default function PrivacyPage() {
  return (
    <main className={css(styles, "shell page-stack legal-page")}>
      <header className={css(styles, "legal-head")}>
        <p className={css(styles, "eyebrow")}>Legal</p>
        <h1>Privacy Policy</h1>
        <p className={css(styles, "lede")}>
          This policy explains what information Sodhani collects when you use
          the site, how we use it, and the choices you have.
        </p>
        <p className={css(styles, "legal-meta")}>Last updated {LAST_UPDATED}</p>
      </header>

      <section className={css(styles, "panel panel-pad legal-section")}>
        <h2>1. Information we collect</h2>
        <p>
          We aim to collect as little personal data as possible. The categories
          below cover everything we touch:
        </p>
        <ul>
          <li>
            <strong>Request data.</strong> When your browser loads the site, our
            servers receive standard request data — IP address, user agent,
            referring page, and the URL you requested.
          </li>
          <li>
            <strong>Usage data.</strong> Anonymised analytics about which
            screens, tickers, and screens you view, used to improve the
            product. We don&apos;t link this to your identity.
          </li>
          <li>
            <strong>Account data.</strong> If you create an account or contact
            us, we collect the details you submit — name, email, organisation
            — and any messages you send.
          </li>
          <li>
            <strong>Cookies and local storage.</strong> Small files that
            remember your preferences (theme, watchlist, recent searches) and
            keep you signed in.
          </li>
        </ul>

        <h2>2. How we use it</h2>
        <ul>
          <li>To run the site and serve the pages you request.</li>
          <li>To remember your preferences across sessions.</li>
          <li>To diagnose errors and keep the platform secure.</li>
          <li>To improve features based on aggregate, anonymised usage.</li>
          <li>To reply when you contact us.</li>
        </ul>
        <p>
          We do not sell your personal information. We do not use it for
          third-party advertising.
        </p>

        <h2>3. Market data providers</h2>
        <p>
          We display market data from vendors including C-MOTS Internet
          Technologies Pvt Ltd. Those vendors operate under their own privacy
          policies and receive your request to their endpoints when their
          content loads on the site.
        </p>

        <h2>4. Hosting and processors</h2>
        <p>
          The site runs on third-party infrastructure (cloud hosting, edge
          caching, error monitoring, and analytics) under data-processing
          agreements that restrict how they may use information about you.
        </p>

        <h2>5. Cookies</h2>
        <p>
          We use first-party cookies and local storage for session, theme, and
          preference state. We use a privacy-respecting analytics cookie to
          count unique sessions. You can clear these any time through your
          browser settings; some features may not work without them.
        </p>

        <h2>6. Retention</h2>
        <p>
          Request logs are kept for up to 30 days for security and debugging.
          Aggregate analytics are retained for up to 24 months. Account data
          is retained while your account is active and for a reasonable period
          after closure to satisfy legal and accounting obligations.
        </p>

        <h2>7. Your rights</h2>
        <p>
          Depending on where you live, you may have rights to access, correct,
          export, or delete your personal data, and to object to or restrict
          certain processing. To exercise these, email{" "}
          <a href="mailto:privacy@sodhani.capital">privacy@sodhani.capital</a>.
          We&apos;ll respond within the timelines required by applicable law.
        </p>

        <h2>8. Security</h2>
        <p>
          We use TLS in transit, encrypted storage at rest, and least-privilege
          access controls. No system is perfectly secure — if we detect a
          breach affecting your data, we&apos;ll notify you in line with
          applicable law.
        </p>

        <h2>9. Children</h2>
        <p>
          The site is not directed at children under 13, and we do not
          knowingly collect personal data from them.
        </p>

        <h2>10. International transfers</h2>
        <p>
          We may process data outside your country of residence, including in
          India and other jurisdictions where our service providers operate.
          Where required, we rely on appropriate safeguards for those
          transfers.
        </p>

        <h2>11. Changes to this policy</h2>
        <p>
          When we change this policy, we&apos;ll update the &ldquo;Last
          updated&rdquo; date above. Material changes will be highlighted on
          the site.
        </p>

        <h2>12. Contact</h2>
        <p>
          Privacy questions? Write to{" "}
          <a href="mailto:privacy@sodhani.capital">privacy@sodhani.capital</a>.
        </p>
      </section>

      <p className={css(styles, "legal-footnote")}>
        See also our <Link href="/terms/">Terms of Service</Link>.
      </p>
    </main>
  );
}
