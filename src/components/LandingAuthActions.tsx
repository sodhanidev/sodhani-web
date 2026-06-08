"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { css } from "@/lib/css-module";
import styles from "@/app/page.module.css";

type AuthUser = {
  avatarUrl?: string;
  displayName?: string;
  email?: string;
  phoneNational?: string;
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

export function LandingAuthActions() {
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const refreshAuthState = useCallback(() => {
    fetch("/api/auth/me/", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { user?: AuthUser | null }) => {
        setUser(payload.user ?? null);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/me/", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { user?: AuthUser | null }) => {
        if (isMounted) {
          setUser(payload.user ?? null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
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
  }, []);

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
      setUser(null);
      setIsMenuOpen(false);
      window.dispatchEvent(new Event("sodhani-auth-changed"));
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return <div className={css(styles, "landing-actions")} aria-hidden="true" />;
  }

  if (user) {
    return (
      <div className={css(styles, "landing-actions landing-profile-menu")} ref={popoverRef}>
        <button
          aria-expanded={isMenuOpen}
          aria-haspopup="dialog"
          aria-label="Open account menu"
          className={css(styles, "landing-avatar-button")}
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          <span className={css(styles, "landing-avatar")} aria-hidden="true">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" width={32} height={32} unoptimized />
            ) : (
              <User size={15} strokeWidth={2} aria-hidden="true" />
            )}
          </span>
        </button>
        {isMenuOpen ? (
          <div className={css(styles, "landing-profile-popover")} role="dialog" aria-label="Account menu">
            <div className={css(styles, "landing-profile-row")}>
              <span className={css(styles, "landing-profile-avatar")} aria-hidden="true">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" width={36} height={36} unoptimized />
                ) : (
                  <User size={18} strokeWidth={2} aria-hidden="true" />
                )}
              </span>
              <span className={css(styles, "landing-profile-meta")}>
                <span className={css(styles, "landing-profile-name")}>{userLabel(user)}</span>
                {user.email ? (
                  <span className={css(styles, "landing-profile-subtitle")}>{user.email}</span>
                ) : user.phoneNational ? (
                  <span className={css(styles, "landing-profile-subtitle")}>+91 {user.phoneNational}</span>
                ) : null}
              </span>
            </div>
            <Link className={css(styles, "landing-profile-link")} href="/market/">
              Market
            </Link>
            <button
              className={css(styles, "landing-profile-logout")}
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

  return (
    <div className={css(styles, "landing-actions")}>
      <Link className={css(styles, "landing-login")} href="/sign-in/">
        <span className={css(styles, "landing-action-icon")} data-icon="user-round" aria-hidden="true" />
        Login
      </Link>
      <Link className={css(styles, "landing-account")} href="/sign-up/">
        <span className={css(styles, "landing-action-icon")} data-icon="user-plus" aria-hidden="true" />
        Sign up
      </Link>
    </div>
  );
}
