import type { Metadata } from "next";
import Link from "next/link";
import { css } from "@/lib/css-module";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service · SAFEedge",
  description:
    "Terms governing access to and use of the Sodhani Capital research and screening tools."
};

const LAST_UPDATED = "May 26, 2026";

export default function TermsPage() {
  return (
    <main className={css(styles, "shell page-stack legal-page")}>
      <header className={css(styles, "legal-head")}>
        <p className={css(styles, "eyebrow")}>Legal</p>
        <h1>Terms of Service</h1>
        <p className={css(styles, "lede")}>
          These terms govern your access to and use of Sodhani — our research,
          screening, and analytics interfaces. By using the site you agree to
          everything below.
        </p>
        <p className={css(styles, "legal-meta")}>Last updated {LAST_UPDATED}</p>
      </header>

      <section className={css(styles, "panel panel-pad legal-section")}>
        <h2>1. Who we are</h2>
        <p>
          Sodhani is operated by Sodhani Capital (&ldquo;Sodhani&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;). Throughout these terms,
          &ldquo;the site&rdquo; refers to this web application and any related
          pages, APIs, or feeds we publish.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You may use the site if you can form a binding contract in your
          jurisdiction and are not barred from doing so under applicable law.
          If you are using the site on behalf of an organisation, you confirm
          you have authority to bind that organisation to these terms.
        </p>

        <h2>3. Acceptable use</h2>
        <ul>
          <li>Don&apos;t scrape, crawl, or hammer the site at volumes that disrupt other users.</li>
          <li>Don&apos;t reverse engineer, decompile, or attempt to extract source code.</li>
          <li>Don&apos;t resell, redistribute, or publicly republish the data feeds shown here.</li>
          <li>Don&apos;t use the site to mislead investors or manipulate markets.</li>
        </ul>

        <h2>4. Market data</h2>
        <p>
          Prices, fundamentals, and corporate information shown on the site are
          provided by third-party vendors including C-MOTS Internet Technologies
          Pvt Ltd. Data may be delayed, incomplete, or revised after
          publication. We do not guarantee the accuracy, completeness, or
          timeliness of any quote, table, or metric.
        </p>

        <h2>5. Not investment advice</h2>
        <p>
          Nothing on this site is investment, tax, legal, or financial advice.
          The screens, peer groups, ratios, and commentary are research aids,
          not recommendations. You are solely responsible for your investment
          decisions and should consult a registered adviser before acting on
          anything you read here.
        </p>

        <h2>6. Intellectual property</h2>
        <p>
          The site&apos;s layout, code, branding, and original written content
          belong to Sodhani Capital. Underlying market data belongs to its
          respective vendors. You receive a limited, revocable, non-exclusive
          licence to view the site for personal, non-commercial research.
        </p>

        <h2>7. Third-party links</h2>
        <p>
          We link to external pages — exchange filings, vendor sites,
          regulators — for convenience. We don&apos;t control those pages and
          aren&apos;t responsible for their content.
        </p>

        <h2>8. Disclaimers</h2>
        <p>
          The site is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;, without warranty of any kind. To the maximum extent
          permitted by law, Sodhani disclaims all warranties, express or
          implied, including merchantability, fitness for a particular purpose,
          and non-infringement.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Sodhani will not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages, or any loss of profits, revenues, data, or goodwill arising
          out of or related to your use of the site.
        </p>

        <h2>10. Changes to these terms</h2>
        <p>
          We may update these terms from time to time. When we do, we&apos;ll
          revise the &ldquo;Last updated&rdquo; date above. Continued use of
          the site after a change means you accept the revised terms.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These terms are governed by the laws of India. Disputes will be
          subject to the exclusive jurisdiction of the courts at Mumbai,
          Maharashtra.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these terms? Write to{" "}
          <a href="mailto:hello@sodhani.capital">hello@sodhani.capital</a>.
        </p>
      </section>

      <p className={css(styles, "legal-footnote")}>
        See also our <Link href="/privacy/">Privacy Policy</Link>.
      </p>
    </main>
  );
}
