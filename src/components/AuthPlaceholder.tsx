import Image from "next/image";
import Link from "next/link";

type AuthMode = "sign-in" | "sign-up";

type AuthPlaceholderProps = {
  mode: AuthMode;
};

const modeCopy = {
  "sign-in": {
    eyebrow: "Account access",
    title: "Sign in to Sodhani",
    lead: "Account access is being prepared. This page keeps the auth flow in place without sending users into market pages.",
    primary: "Sign in unavailable",
    google: "Continue with Google",
    alternateLabel: "Need an account?",
    alternateCta: "Create one",
    alternateHref: "/sign-up/"
  },
  "sign-up": {
    eyebrow: "New account",
    title: "Create your Sodhani account",
    lead: "Account creation is being prepared. This page is the placeholder route for onboarding until auth is wired up.",
    primary: "Create account unavailable",
    google: "Sign up with Google",
    alternateLabel: "Already registered?",
    alternateCta: "Sign in",
    alternateHref: "/sign-in/"
  }
} satisfies Record<AuthMode, Record<string, string>>;

export function AuthPlaceholder({ mode }: AuthPlaceholderProps) {
  const copy = modeCopy[mode];

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-aside">
          <Link className="auth-brand" href="/">
            <Image src="/logo-transparent.png" alt="" width={34} height={34} priority />
            <span>Sodhani</span>
          </Link>
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 id="auth-title">{copy.title}</h1>
            <p>{copy.lead}</p>
          </div>
          <Link className="auth-back-link" href="/">
            Back to home
          </Link>
        </div>

        <div className="auth-card">
          <div className="auth-switch" aria-label="Authentication mode">
            <Link className={mode === "sign-in" ? "active" : undefined} href="/sign-in/">
              Sign in
            </Link>
            <Link className={mode === "sign-up" ? "active" : undefined} href="/sign-up/">
              Sign up
            </Link>
          </div>

          <button className="auth-google" type="button" disabled>
            <Image src="/icons/google.svg" alt="" width={18} height={18} aria-hidden="true" />
            {copy.google}
          </button>

          <div className="auth-divider">
            <span />
            <p>Email</p>
            <span />
          </div>

          <form className="auth-form">
            {mode === "sign-up" ? (
              <label>
                Name
                <input disabled name="name" placeholder="Your name" type="text" />
              </label>
            ) : null}
            <label>
              Email
              <input disabled name="email" placeholder="you@example.com" type="email" />
            </label>
            <label>
              Password
              <input disabled name="password" placeholder="Password" type="password" />
            </label>
            <button type="button" disabled>
              {copy.primary}
            </button>
          </form>

          <p className="auth-alt">
            {copy.alternateLabel} <Link href={copy.alternateHref}>{copy.alternateCta}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
