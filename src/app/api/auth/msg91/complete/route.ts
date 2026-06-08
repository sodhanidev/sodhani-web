import type { NextRequest } from "next/server";

import { authError, authJson, readJsonBody } from "@/lib/auth/api";
import { verifyMsg91AccessToken } from "@/lib/auth/msg91";
import { normalizeIndianPhone } from "@/lib/auth/phone";
import { authUserFromDocument, createAuthSession, setSessionCookie, upsertUserFromPhone } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shouldReturnSessionToken(clientType: unknown) {
  return clientType === "mobile";
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const accessToken = typeof body?.accessToken === "string" ? body.accessToken.trim() : "";

    if (!accessToken) {
      return authError(new Error("Missing MSG91 access token."), 422);
    }

    const verification = await verifyMsg91AccessToken(accessToken);
    const phone = normalizeIndianPhone(verification.identifier) ?? normalizeIndianPhone(body?.phone);

    if (!phone) {
      return authError(new Error("MSG91 did not return a valid phone identifier."), 422);
    }

    const displayName = typeof body?.name === "string" ? body.name : undefined;
    const user = await upsertUserFromPhone({
      displayName,
      phoneE164: phone.e164,
      phoneNational: phone.national
    });
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
    return authError(error, error instanceof Error && error.message.startsWith("MSG91:") ? 502 : 500);
  }
}
