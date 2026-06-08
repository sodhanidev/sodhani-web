import { NextResponse, type NextRequest } from "next/server";

import {
  GOOGLE_OAUTH_NONCE_COOKIE,
  GOOGLE_OAUTH_RETURN_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  buildGoogleAuthUrl,
  googleCookieOptions,
  randomOauthValue,
  resolveGoogleRedirectUri,
  safeReturnTo
} from "@/lib/auth/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const state = randomOauthValue();
  const nonce = randomOauthValue();
  const redirectUri = resolveGoogleRedirectUri(request);
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const response = NextResponse.redirect(
    buildGoogleAuthUrl({
      nonce,
      redirectUri,
      state
    })
  );

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, googleCookieOptions());
  response.cookies.set(GOOGLE_OAUTH_NONCE_COOKIE, nonce, googleCookieOptions());
  response.cookies.set(GOOGLE_OAUTH_RETURN_COOKIE, returnTo, googleCookieOptions());

  return response;
}
