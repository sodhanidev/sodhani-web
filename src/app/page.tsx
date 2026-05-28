import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

import { LandingSearch } from "@/components/LandingSearch";
import { SiteFooter } from "@/components/SiteFooter";
import { getSearchItems } from "@/lib/data/search-index";

const exampleCompanies = [
  "Avantel",
  "Coastal Corp",
  "Frontier Springs",
  "Godawari Power",
  "Grand Continent",
  "HBL Engineering",
  "Pix Transmission",
  "RACL Geartech",
  "Sandur Manganese",
  "Shivalik Bimetal",
  "VTM"
];

export default function HomePage() {
  const companyItems = getSearchItems().filter((item) => item.kind === "Company");
  const examples = exampleCompanies.map((name) => {
    const match = companyItems.find((item) =>
      `${item.label} ${item.code ?? ""}`.toLowerCase().includes(name.toLowerCase())
    );

    return {
      name,
      href: match ? match.href : `/search/?q=${encodeURIComponent(name)}`
    };
  });

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <nav className="landing-nav" aria-label="Landing navigation">
          <div className="landing-links">
            <Link href="/">Home</Link>
            <Link href="/market/">Screens</Link>
            <Link href="/market/">
              Tools <ChevronDown size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="landing-actions">
            <Link className="landing-login" href="/sign-in/">
              <span className="landing-action-icon" data-icon="user-round" aria-hidden="true" />
              Login
            </Link>
            <Link className="landing-account" href="/sign-up/">
              <span className="landing-action-icon" data-icon="user-plus" aria-hidden="true" />
              Sign up
            </Link>
          </div>
        </nav>

        <div className="landing-center">
          <h1 className="landing-logo">
            <Image
              className="landing-logo-img"
              src="/logo-transparent.png"
              alt=""
              width={88}
              height={86}
              priority
            />
            <span>sodhani</span>
          </h1>
          <p>Stock analysis and screening tool for investors in India.</p>
          <LandingSearch />

          <div className="landing-examples">
            <span>Or analyse:</span>
            <div>
              {examples.map((example) => (
                <Link href={example.href} key={example.name}>
                  {example.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
