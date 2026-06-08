"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { css } from "@/lib/css-module";
import styles from "./layout.module.css";

type AuthUser = {
  avatarUrl?: string;
  displayName?: string;
  email?: string;
  phoneNational?: string;
};

type AuthState = {
  user: AuthUser | null;
};

function userLabel(user: AuthUser) {
  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user.email) {
    return user.email;
  }

  if (user.phoneNational) {
    return `••••${user.phoneNational.slice(-4)}`;
  }

  return "Account";
}

function userInitial(user: AuthUser) {
  return (
    user.displayName?.trim().charAt(0) ||
    user.email?.charAt(0) ||
    user.phoneNational?.charAt(0) ||
    "S"
  ).toUpperCase();
}

export function AuthNavStatus() {
  const pathname = usePathname();
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<AuthState>({ user: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const refreshAuthState = useCallback(() => {
    fetch("/api/auth/me/", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: AuthState) => {
        setState({ user: payload.user ?? null });
      })
      .catch(() => {
        setState({ user: null });
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/me/", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: AuthState) => {
        if (isMounted) {
          setState({ user: payload.user ?? null });
        }
      })
      .catch(() => {
        if (isMounted) {
          setState({ user: null });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    const handleAuthChanged = () => {
      refreshAuthState();
      router.refresh();
    };

    window.addEventListener("sodhani-auth-changed", handleAuthChanged);
    window.addEventListener("focus", handleAuthChanged);

    return () => {
      window.removeEventListener("sodhani-auth-changed", handleAuthChanged);
      window.removeEventListener("focus", handleAuthChanged);
    };
  }, [refreshAuthState, router]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout/", {
        method: "POST"
      });
      setState({ user: null });
      setIsMenuOpen(false);
      window.dispatchEvent(new Event("sodhani-auth-changed"));
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return <div className={css(styles, "auth-nav-placeholder")} aria-hidden="true" />;
  }

  if (!state.user) {
    return (
      <div className={css(styles, "auth-nav")}>
        <Link className={css(styles, "auth-nav-link")} href="/sign-in/">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={css(styles, "auth-nav")} ref={popoverRef}>
      <button
        aria-expanded={isMenuOpen}
        aria-haspopup="dialog"
        aria-label="Open account menu"
        className={css(styles, "auth-nav-avatar-button")}
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        <span className={css(styles, "auth-nav-avatar")} aria-hidden="true">
          {state.user.avatarUrl ? (
            <Image src={state.user.avatarUrl} alt="" width={32} height={32} unoptimized />
          ) : state.user.phoneNational ? (
            <User size={14} strokeWidth={2} aria-hidden="true" />
          ) : (
            userInitial(state.user)
          )}
        </span>
      </button>
      {isMenuOpen ? (
        <div className={css(styles, "auth-account-popover")} role="dialog" aria-label="Account menu">
          <div className={css(styles, "auth-account-row")}>
            <span className={css(styles, "auth-account-avatar")} aria-hidden="true">
              {state.user.avatarUrl ? (
                <Image src={state.user.avatarUrl} alt="" width={36} height={36} unoptimized />
              ) : (
                <User size={18} strokeWidth={2} aria-hidden="true" />
              )}
            </span>
            <span className={css(styles, "auth-account-meta")}>
              <span className={css(styles, "auth-account-name")}>{userLabel(state.user)}</span>
              {state.user.email ? (
                <span className={css(styles, "auth-account-subtitle")}>{state.user.email}</span>
              ) : state.user.phoneNational ? (
                <span className={css(styles, "auth-account-subtitle")}>+91 {state.user.phoneNational}</span>
              ) : null}
            </span>
          </div>
          <button
            className={css(styles, "auth-account-logout")}
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={15} strokeWidth={2} aria-hidden="true" />
            <span>{isLoggingOut ? "Logging out" : "Log out"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
