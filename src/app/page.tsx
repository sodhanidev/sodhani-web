import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Heart, Laptop, Moon, Sun, UserRound } from "lucide-react";

import { LandingSearch } from "@/components/LandingSearch";
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

const googlePlayHref = "https://play.google.com/store/search?q=Sodhani&c=apps";
const appStoreHref = "https://apps.apple.com/in/search?term=Sodhani";

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
            <Link className="landing-login" href="/company/RELIANCE/">
              <UserRound size={13} aria-hidden="true" />
              LOGIN
            </Link>
            <Link className="landing-account" href="/market/">
              GET FREE ACCOUNT
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

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <div className="footer-logo">
            <Image
              className="footer-logo-img"
              src="/logo-transparent.png"
              alt=""
              width={34}
              height={34}
            />
            <span>sodhani</span>
          </div>
          <p className="footer-tagline">Stock analysis and screening tool</p>
          <p className="footer-copy">
            Sodhani Capital © 2009-2025
            <br />
            Made with <Heart size={14} fill="currentColor" aria-hidden="true" /> in India.
          </p>
          <p className="footer-copy">Data provided by C-MOTS Internet Technologies Pvt Ltd</p>
          <p className="footer-legal">
            <Link href="/terms/">Terms</Link> &amp; <Link href="/privacy/">Privacy</Link>.
          </p>
        </div>
        <div className="landing-footer-cols">
          <div>
            <h2>Product</h2>
            <Link href="/market/">Premium</Link>
            <Link href="/market/">What&apos;s new?</Link>
            <Link href="/market/">Learn</Link>
            <div className="store-badges" aria-label="App downloads">
              <a className="store-badge" href={appStoreHref} rel="noopener noreferrer" target="_blank">
                <Image
                  className="store-badge-icon store-badge-apple"
                  src="/icons/apple.svg"
                  alt=""
                  width={30}
                  height={30}
                  aria-hidden="true"
                />
                <span>
                  <small>Download on the</small>
                  <strong>App Store</strong>
                </span>
              </a>
              <a className="store-badge" href={googlePlayHref} rel="noopener noreferrer" target="_blank">
                <Image
                  className="store-badge-icon"
                  src="/icons/google-play.svg"
                  alt=""
                  width={28}
                  height={31}
                  aria-hidden="true"
                />
                <span>
                  <small>GET IT ON</small>
                  <strong>Google Play</strong>
                </span>
              </a>
            </div>
          </div>
          <div>
            <h2>Team</h2>
            <Link href="/market/">About us</Link>
            <Link href="/market/">Support</Link>
          </div>
          <div>
            <h2>Theme</h2>
            <button aria-pressed="false" data-theme-option="light" type="button">
              <Sun size={14} aria-hidden="true" />
              Light
            </button>
            <button aria-pressed="false" data-theme-option="dark" type="button">
              <Moon size={14} aria-hidden="true" />
              Dark
            </button>
            <button aria-pressed="false" data-theme-option="system" type="button">
              <Laptop size={14} aria-hidden="true" />
              Auto
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
