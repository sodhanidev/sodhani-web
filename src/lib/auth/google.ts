import { randomBytes } from "node:crypto";

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { NextRequest } from "next/server";

import { getGoogleConfig } from "./config";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export const GOOGLE_OAUTH_STATE_COOKIE = "sodhani_google_oauth_state";
export const GOOGLE_OAUTH_NONCE_COOKIE = "sodhani_google_oauth_nonce";
export const GOOGLE_OAUTH_RETURN_COOKIE = "sodhani_google_oauth_return_to";

export type GoogleProfile = {
  avatarUrl?: string;
  displayName?: string;
  email: string;
  googleSub: string;
};

type GoogleIdPayload = JWTPayload & {
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
  picture?: unknown;
  sub?: unknown;
};

type GoogleTokenResponse = {
  error?: string;
  error_description?: string;
  id_token?: string;
};

export function randomOauthValue() {
  return randomBytes(32).toString("base64url");
}

export function googleCookieOptions(maxAge = 10 * 60) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export function resolveGoogleRedirectUri(request: NextRequest) {
  const { GOOGLE_REDIRECT_URI } = getGoogleConfig();

  if (GOOGLE_REDIRECT_URI) {
    return GOOGLE_REDIRECT_URI;
  }

  return new URL("/api/auth/google/callback/", request.url).toString();
}

export function safeReturnTo(value: unknown) {
  if (typeof value !== "string") {
    return "/";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function googleFailureRedirect(request: NextRequest, reason = "google") {
  const url = new URL("/sign-in/", request.url);
  url.searchParams.set("auth_error", reason);
  return url;
}

export function buildGoogleAuthUrl({
  nonce,
  redirectUri,
  state
}: {
  nonce: string;
  redirectUri: string;
  state: string;
}) {
  const { GOOGLE_CLIENT_ID } = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    prompt: "select_account"
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCodeForIdToken({
  code,
  redirectUri
}: {
  code: string;
  redirectUri: string;
}) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = getGoogleConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    }),
    cache: "no-store"
  });
  const payload = (await response.json().catch(() => ({}))) as GoogleTokenResponse;

  if (!response.ok || !payload.id_token) {
    throw new Error(payload.error_description ?? payload.error ?? "Google token exchange failed");
  }

  return payload.id_token;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export async function verifyGoogleIdToken(idToken: string, expectedNonce?: string): Promise<GoogleProfile> {
  const { GOOGLE_ALLOWED_CLIENT_IDS } = getGoogleConfig();
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    audience: GOOGLE_ALLOWED_CLIENT_IDS,
    issuer: GOOGLE_ISSUERS
  });
  const googlePayload = payload as GoogleIdPayload;

  if (expectedNonce && googlePayload.nonce !== expectedNonce) {
    throw new Error("Google sign-in nonce mismatch");
  }

  if (googlePayload.email_verified !== true && googlePayload.email_verified !== "true") {
    throw new Error("Google account email is not verified");
  }

  const email = readString(googlePayload.email);
  const googleSub = readString(googlePayload.sub);

  if (!email || !googleSub) {
    throw new Error("Google did not return a usable profile");
  }

  return {
    email,
    googleSub,
    displayName: readString(googlePayload.name),
    avatarUrl: readString(googlePayload.picture)
  };
}
