import Image from "next/image";
import Link from "next/link";
import { css } from "@/lib/css-module";
import styles from "./AuthPlaceholder.module.css";

type AuthMode = "sign-in" | "sign-up";

type AuthPlaceholderProps = {
  mode: AuthMode;
};

const modeCopy = {
  "sign-in": {
    title: "Sign in",
    primary: "Sign in",
    google: "Continue with Google",
    alternateLabel: "Don't have an account?",
    alternateCta: "Sign up",
    alternateHref: "/sign-up/"
  },
  "sign-up": {
    title: "Create your account",
    primary: "Create account",
    google: "Continue with Google",
    alternateLabel: "Already have an account?",
    alternateCta: "Sign in",
    alternateHref: "/sign-in/"
  }
} satisfies Record<AuthMode, Record<string, string>>;

export function AuthPlaceholder({ mode }: AuthPlaceholderProps) {
  const copy = modeCopy[mode];

  return (
    <main className={css(styles, "auth-page")}>
      <div className={css(styles, "auth-shell")}>
        <Link className={css(styles, "auth-brand")} href="/">
          <Image src="/logo-transparent.png" alt="" width={28} height={28} priority />
          <span>sodhani</span>
        </Link>

        <h1 className={css(styles, "auth-title")}>{copy.title}</h1>

        <div className={css(styles, "auth-switch")} role="tablist" aria-label="Authentication mode">
          <Link
            aria-selected={mode === "sign-in"}
            className={css(styles, mode === "sign-in" ? "active" : undefined)}
            href="/sign-in/"
            role="tab"
          >
            Sign in
          </Link>
          <Link
            aria-selected={mode === "sign-up"}
            className={css(styles, mode === "sign-up" ? "active" : undefined)}
            href="/sign-up/"
            role="tab"
          >
            Sign up
          </Link>
        </div>

        <button className={css(styles, "auth-google")} type="button">
          <Image src="/icons/google.svg" alt="" width={16} height={16} aria-hidden="true" />
          {copy.google}
        </button>

        <div className={css(styles, "auth-divider")} aria-hidden="true">
          <span />
          <p>or with email</p>
          <span />
        </div>

        <form className={css(styles, "auth-form")} noValidate>
          {mode === "sign-up" ? (
            <label>
              <span>Name</span>
              <input autoComplete="name" name="name" placeholder="Jane Doe" type="text" />
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <input autoComplete="email" name="email" placeholder="you@example.com" type="email" />
          </label>
          <label>
            <span className={css(styles, "auth-label-row")}>
              Password
              {mode === "sign-in" ? (
                <Link className={css(styles, "auth-inline-link")} href="/sign-in/">
                  Forgot?
                </Link>
              ) : null}
            </span>
            <input
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              name="password"
              placeholder="••••••••"
              type="password"
            />
          </label>
          <button className={css(styles, "auth-primary")} type="submit">
            {copy.primary}
          </button>
        </form>

        <p className={css(styles, "auth-alt")}>
          {copy.alternateLabel}{" "}
          <Link href={copy.alternateHref}>{copy.alternateCta}</Link>
        </p>

        <p className={css(styles, "auth-fineprint")}>
          By continuing you agree to our <Link href="/terms/">Terms</Link> and{" "}
          <Link href="/privacy/">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
