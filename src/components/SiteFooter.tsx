import Image from "next/image";
import Link from "next/link";
import { Heart, Laptop, Moon, Sun } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./SiteFooter.module.css";

const googlePlayHref = "https://play.google.com/store/search?q=Sodhani&c=apps";
const appStoreHref = "https://apps.apple.com/in/search?term=Sodhani";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={css(styles, "landing-footer", className)}>
      <div className={css(styles, "landing-footer-brand")}>
        <div className={css(styles, "footer-logo")}>
          <Image
            className={css(styles, "footer-logo-img")}
            src="/logo-transparent.png"
            alt=""
            width={34}
            height={34}
          />
          <span>sodhani</span>
        </div>
        <p className={css(styles, "footer-tagline")}>Stock analysis and screening tool</p>
        <p className={css(styles, "footer-copy")}>
          Sodhani Capital &copy; 2009-2025
          <br />
          Made with <Heart size={14} fill="currentColor" aria-hidden="true" /> in India.
        </p>
        <p className={css(styles, "footer-copy")}>Data provided by C-MOTS Internet Technologies Pvt Ltd</p>
        <p className={css(styles, "footer-legal")}>
          <Link href="/terms/">Terms</Link> &amp; <Link href="/privacy/">Privacy</Link>.
        </p>
      </div>
      <div className={css(styles, "landing-footer-cols")}>
        <div>
          <h2>Product</h2>
          <Link href="/market/">Premium</Link>
          <Link href="/market/">What&apos;s new?</Link>
          <Link href="/market/">Learn</Link>
          <div className={css(styles, "store-badges")} aria-label="App downloads">
            <a className={css(styles, "store-badge")} href={appStoreHref} rel="noopener noreferrer" target="_blank">
              <Image
                className={css(styles, "store-badge-icon store-badge-apple")}
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
            <a className={css(styles, "store-badge")} href={googlePlayHref} rel="noopener noreferrer" target="_blank">
              <Image
                className={css(styles, "store-badge-icon")}
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
          <button
            aria-pressed="true"
            data-active="true"
            data-theme-option="light"
            suppressHydrationWarning
            type="button"
          >
            <Sun size={14} aria-hidden="true" />
            Light
          </button>
          <button aria-pressed="false" data-theme-option="dark" suppressHydrationWarning type="button">
            <Moon size={14} aria-hidden="true" />
            Dark
          </button>
          <button aria-pressed="false" data-theme-option="system" suppressHydrationWarning type="button">
            <Laptop size={14} aria-hidden="true" />
            Auto
          </button>
        </div>
      </div>
    </footer>
  );
}
