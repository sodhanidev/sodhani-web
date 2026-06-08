import type { NextRequest } from "next/server";

import { authError, authJson, readJsonBody } from "@/lib/auth/api";
import { verifyGoogleIdToken } from "@/lib/auth/google";
import { authUserFromDocument, createAuthSession, setSessionCookie, upsertUserFromGoogle } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shouldReturnSessionToken(clientType: unknown) {
  return clientType === "mobile";
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const idToken = typeof body?.idToken === "string" ? body.idToken.trim() : "";
    const nonce = typeof body?.nonce === "string" ? body.nonce.trim() : undefined;

    if (!idToken) {
      return authError(new Error("Missing Google ID token."), 422);
    }

    const profile = await verifyGoogleIdToken(idToken, nonce);
    const user = await upsertUserFromGoogle(profile);
    const session = await createAuthSession(user._id, request);

    await setSessionCookie(session.token);

    return authJson({
      ok: true,
      user: authUserFromDocument(user),
      ...(shouldReturnSessionToken(body?.clientType)
        ? {
            sessionToken: session.token,
            expiresAt: session.expiresAt.toISOString()
          }
        : {})
    });
  } catch (error) {
    return authError(error, 500);
  }
}
