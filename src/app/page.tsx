import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Heart, Laptop, Moon, Sun, UserRound, Zap } from "lucide-react";

import { LandingSearch } from "@/components/LandingSearch";
import { getCompanies } from "@/lib/data/companies";
import { getAvailableStockCodes } from "@/lib/data/stocks";

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
  const companies = getCompanies();
  const availableStockCodes = getAvailableStockCodes();

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <nav className="landing-nav" aria-label="Landing navigation">
          <div className="landing-links">
            <Link href="/">HOME</Link>
            <Link href="/market/">SCREENS</Link>
            <Link href="/market/">
              TOOLS <ChevronDown size={14} aria-hidden="true" />
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
          <LandingSearch availableStockCodes={availableStockCodes} companies={companies} />

          <div className="landing-examples">
            <span>Or analyse:</span>
            <div>
              {exampleCompanies.map((name) => (
                <Link href={`/search/?q=${encodeURIComponent(name)}`} key={name}>
                  {name}
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
            Mittal Analytics Private Ltd © 2009-2025
            <br />
            Made with <Heart size={14} fill="currentColor" aria-hidden="true" /> in India.
          </p>
          <p className="footer-copy">Data provided by C-MOTS Internet Technologies Pvt Ltd</p>
          <p className="footer-legal">
            <Link href="/market/">Terms</Link> &amp; <Link href="/market/">Privacy</Link>.
          </p>
        </div>
        <div className="landing-footer-cols">
          <div>
            <h2>Product</h2>
            <Link href="/market/">Premium</Link>
            <Link href="/market/">What&apos;s new?</Link>
            <Link href="/market/">Learn</Link>
            <Link className="install-button" href="/market/">
              <Zap size={14} fill="currentColor" aria-hidden="true" />
              INSTALL
            </Link>
          </div>
          <div>
            <h2>Team</h2>
            <Link href="/market/">About us</Link>
            <Link href="/market/">Support</Link>
          </div>
          <div>
            <h2>Theme</h2>
            <button type="button">
              <Sun size={14} aria-hidden="true" />
              Light
            </button>
            <button type="button">
              <Moon size={14} aria-hidden="true" />
              Dark
            </button>
            <button type="button">
              <Laptop size={14} aria-hidden="true" />
              Auto
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
