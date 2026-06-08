import { NextResponse, type NextRequest } from "next/server";

import {
  GOOGLE_OAUTH_NONCE_COOKIE,
  GOOGLE_OAUTH_RETURN_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCodeForIdToken,
  googleFailureRedirect,
  googleCookieOptions,
  resolveGoogleRedirectUri,
  safeReturnTo,
  verifyGoogleIdToken
} from "@/lib/auth/google";
import { createAuthSession, setSessionCookieOnResponse, upsertUserFromGoogle } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clearGoogleCookies(response: NextResponse) {
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { ...googleCookieOptions(0), maxAge: 0 });
  response.cookies.set(GOOGLE_OAUTH_NONCE_COOKIE, "", { ...googleCookieOptions(0), maxAge: 0 });
  response.cookies.set(GOOGLE_OAUTH_RETURN_COOKIE, "", { ...googleCookieOptions(0), maxAge: 0 });
}

export async function GET(request: NextRequest) {
  try {
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      const response = NextResponse.redirect(googleFailureRedirect(request, error));
      clearGoogleCookies(response);
      return response;
    }

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
    const storedNonce = request.cookies.get(GOOGLE_OAUTH_NONCE_COOKIE)?.value;
    const returnTo = safeReturnTo(request.cookies.get(GOOGLE_OAUTH_RETURN_COOKIE)?.value);

    if (!code || !state || !storedState || !storedNonce || state !== storedState) {
      const response = NextResponse.redirect(googleFailureRedirect(request, "state"));
      clearGoogleCookies(response);
      return response;
    }

    const idToken = await exchangeGoogleCodeForIdToken({
      code,
      redirectUri: resolveGoogleRedirectUri(request)
    });
    const profile = await verifyGoogleIdToken(idToken, storedNonce);
    const user = await upsertUserFromGoogle(profile);
    const session = await createAuthSession(user._id, request);
    const response = NextResponse.redirect(new URL(returnTo, request.url));

    setSessionCookieOnResponse(response, session.token);
    clearGoogleCookies(response);

    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }

    const response = NextResponse.redirect(googleFailureRedirect(request));
    clearGoogleCookies(response);
    return response;
  }
}
