"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, ClipboardEvent, useEffect, useMemo, useRef, useState } from "react";

import { css } from "@/lib/css-module";
import styles from "./AuthPlaceholder.module.css";

type AuthMode = "sign-in" | "sign-up";

type AuthPlaceholderProps = {
  mode: AuthMode;
};

const modeCopy = {
  "sign-in": {
    title: "Sign in with OTP",
    primary: "Send OTP",
    verify: "Verify and sign in",
    alternateLabel: "Don't have an account?",
    alternateCta: "Sign up",
    alternateHref: "/sign-up/",
    summary: "Use your mobile number to continue. We will send a one-time code over SMS."
  },
  "sign-up": {
    title: "Create your account",
    primary: "Send OTP",
    verify: "Verify and create account",
    alternateLabel: "Already have an account?",
    alternateCta: "Sign in",
    alternateHref: "/sign-in/",
    summary: "Create an account with your mobile number. Passwords are not required."
  }
} satisfies Record<AuthMode, Record<string, string>>;

type OtpResponse = {
  error?: string;
  reqId?: string;
  phone?: string;
};

const REDIRECT_AFTER_AUTH = "/";
const OTP_LENGTH = 4;
const googleAuthErrorCopy = "Google sign-in could not be completed. Try again or use mobile OTP.";

// Only allow same-origin, relative paths so `returnTo` can't be used as an
// open redirect (mirrors `safeReturnTo` in src/lib/auth/google.ts).
function resolveSafeRedirect(value: string | null | undefined) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return REDIRECT_AFTER_AUTH;
  }

  return value;
}

function normalizePhoneInput(value: string) {
  const digits = value.replace(/\D/gu, "");
  const withoutCountryCode = digits.length > 10 && digits.startsWith("91") ? digits.slice(2) : digits;

  return withoutCountryCode.slice(0, 10);
}

async function postAuth(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = (await response.json().catch(() => ({}))) as OtpResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Authentication failed");
  }

  return payload;
}

export function AuthPlaceholder({ mode }: AuthPlaceholderProps) {
  const copy = modeCopy[mode];
  const router = useRouter();
  const [googleError] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).has("auth_error") ? googleAuthErrorCopy : "";
  });
  const [redirectTarget] = useState(() => {
    if (typeof window === "undefined") {
      return REDIRECT_AFTER_AUTH;
    }

    return resolveSafeRedirect(new URLSearchParams(window.location.search).get("returnTo"));
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [reqId, setReqId] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const otpInputs = useRef<Array<HTMLInputElement | null>>([]);
  const isOtpStep = Boolean(reqId);
  const primaryLabel = isOtpStep ? copy.verify : copy.primary;
  // Carry `returnTo` across in-page navigations (mode tabs, Google, alt CTA)
  // so the post-login redirect target survives.
  const returnToQuery = useMemo(
    () => (redirectTarget === REDIRECT_AFTER_AUTH ? "" : `?returnTo=${encodeURIComponent(redirectTarget)}`),
    [redirectTarget]
  );
  const withReturnTo = (href: string) => `${href}${returnToQuery}`;
  const canSubmit = useMemo(() => {
    if (isSubmitting) {
      return false;
    }

    if (isOtpStep) {
      return new RegExp(`^\\d{${OTP_LENGTH}}$`, "u").test(otp);
    }

    return phone.length === 10;
  }, [isOtpStep, isSubmitting, otp, phone]);

  useEffect(() => {
    if (googleError) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [googleError]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  // Focus first OTP box as soon as we enter the verify step.
  useEffect(() => {
    if (isOtpStep) {
      otpInputs.current[0]?.focus();
    }
  }, [isOtpStep]);

  function setOtpDigit(index: number, digit: string) {
    setOtp((current) => {
      const chars = current.padEnd(OTP_LENGTH, " ").split("");
      chars[index] = digit || " ";
      return chars.join("").replace(/\s+$/u, "");
    });
  }

  function handleOtpChange(index: number, raw: string) {
    const digit = raw.replace(/\D/gu, "").slice(-1);
    setOtpDigit(index, digit);

    if (digit && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      event.preventDefault();
      setOtpDigit(index - 1, "");
      otpInputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpInputs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/gu, "").slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    event.preventDefault();
    setOtp(pasted);
    const next = Math.min(pasted.length, OTP_LENGTH - 1);
    otpInputs.current[next]?.focus();
  }

  function resetToPhoneStep() {
    setReqId("");
    setOtp("");
    setMaskedPhone("");
    setMessage("");
    setError("");
  }

  async function sendOtp() {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const payload = await postAuth("/api/auth/otp/send/", { phone });
      setReqId(payload.reqId ?? "");
      setMaskedPhone(payload.phone ?? "");
      setOtp("");
      setResendSeconds(30);
      setMessage(`OTP sent${payload.phone ? ` to ${payload.phone}` : ""}.`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await postAuth("/api/auth/otp/verify/", {
        phone,
        reqId,
        otp,
        ...(mode === "sign-up" ? { name } : {})
      });
      setMessage("Signed in. Redirecting...");
      window.dispatchEvent(new Event("sodhani-auth-changed"));

      // Refresh the RSC cache (it was populated while logged out) before
      // navigating so the destination renders in its signed-in state.
      router.refresh();
      router.replace(redirectTarget);

      // Fallback: a soft `router.replace` can silently no-op (e.g. if the
      // RSC payload errors or the target is the current route). Force a hard
      // navigation shortly after so the user is never stranded on the auth
      // page after a successful sign-in.
      window.setTimeout(() => {
        if (window.location.pathname !== redirectTarget.split("?")[0]) {
          window.location.assign(redirectTarget);
        }
      }, 600);

      return;
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Unable to verify OTP");
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    if (isOtpStep) {
      await verifyOtp();
      return;
    }

    await sendOtp();
  }

  return (
    <main className={css(styles, "auth-page")}>
      <div className={css(styles, "auth-shell")}>
        <Link className={css(styles, "auth-brand")} href="/">
          <Image src="/logo-transparent.png" alt="" width={28} height={28} priority />
          <span>SAFEedge</span>
        </Link>

        <h1 className={css(styles, "auth-title")}>{copy.title}</h1>

        <div className={css(styles, "auth-switch")} role="tablist" aria-label="Authentication mode">
          <Link
            aria-selected={mode === "sign-in"}
            className={css(styles, mode === "sign-in" ? "active" : undefined)}
            href={withReturnTo("/sign-in/")}
            role="tab"
          >
            Sign in
          </Link>
          <Link
            aria-selected={mode === "sign-up"}
            className={css(styles, mode === "sign-up" ? "active" : undefined)}
            href={withReturnTo("/sign-up/")}
            role="tab"
          >
            Sign up
          </Link>
        </div>

        {isOtpStep ? (
          <>
            <p className={css(styles, "auth-summary")}>
              Enter the {OTP_LENGTH}-digit code we sent to{" "}
              <strong className={css(styles, "auth-phone-target")}>+91 {maskedPhone || phone}</strong>.
            </p>

            <form className={css(styles, "auth-form")} noValidate onSubmit={handleSubmit}>
              <div
                className={css(styles, "auth-otp-boxes")}
                role="group"
                aria-label={`${OTP_LENGTH}-digit one-time code`}
              >
                {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpInputs.current[index] = element;
                    }}
                    aria-label={`Digit ${index + 1}`}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    className={css(styles, "auth-otp-box")}
                    inputMode="numeric"
                    maxLength={1}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    type="text"
                    value={otp[index] ?? ""}
                  />
                ))}
              </div>

              <div className={css(styles, "auth-otp-actions")}>
                <button
                  className={css(styles, "auth-inline-link")}
                  onClick={resetToPhoneStep}
                  type="button"
                >
                  Change number
                </button>
                <button
                  className={css(styles, "auth-inline-link")}
                  disabled={isSubmitting || resendSeconds > 0}
                  onClick={sendOtp}
                  type="button"
                >
                  {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
                </button>
              </div>

              {message ? <p className={css(styles, "auth-message")}>{message}</p> : null}
              {error ? <p className={css(styles, "auth-message error")}>{error}</p> : null}

              <button className={css(styles, "auth-primary")} disabled={!canSubmit} type="submit">
                {isSubmitting ? "Please wait..." : primaryLabel}
              </button>
            </form>
          </>
        ) : (
          <>
            <a className={css(styles, "auth-google")} href={withReturnTo("/api/auth/google/start/")}>
              <Image src="/icons/google.svg" alt="" width={16} height={16} aria-hidden="true" />
              Continue with Google
            </a>

            <div className={css(styles, "auth-divider")} aria-hidden="true">
              <span />
              <p>or with mobile OTP</p>
              <span />
            </div>

            <p className={css(styles, "auth-summary")}>{copy.summary}</p>

            <form className={css(styles, "auth-form")} noValidate onSubmit={handleSubmit}>
              {mode === "sign-up" ? (
                <label>
                  <span>Name</span>
                  <input
                    autoComplete="name"
                    name="name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Jane Doe"
                    type="text"
                    value={name}
                  />
                </label>
              ) : null}
              <label>
                <span>Mobile number</span>
                <span className={css(styles, "auth-phone-input")}>
                  <span className={css(styles, "auth-phone-prefix")}>+91</span>
                  <input
                    autoComplete="tel-national"
                    inputMode="numeric"
                    maxLength={10}
                    name="phone"
                    onChange={(event) => {
                      setPhone(normalizePhoneInput(event.target.value));
                      setMessage("");
                      setError("");
                    }}
                    placeholder="98765 43210"
                    type="tel"
                    value={phone}
                  />
                </span>
              </label>

              {message ? <p className={css(styles, "auth-message")}>{message}</p> : null}
              {error || googleError ? (
                <p className={css(styles, "auth-message error")}>{error || googleError}</p>
              ) : null}

              <button className={css(styles, "auth-primary")} disabled={!canSubmit} type="submit">
                {isSubmitting ? "Please wait..." : primaryLabel}
              </button>
            </form>
          </>
        )}

        <p className={css(styles, "auth-alt")}>
          {copy.alternateLabel}{" "}
          <Link href={withReturnTo(copy.alternateHref)}>{copy.alternateCta}</Link>
        </p>

        <p className={css(styles, "auth-fineprint")}>
          By continuing you agree to our <Link href="/terms/">Terms</Link> and{" "}
          <Link href="/privacy/">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
