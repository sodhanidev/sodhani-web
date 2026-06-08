import type { NextRequest } from "next/server";

import { authError, authJson } from "@/lib/auth/api";
import { clearSessionCookie, revokeCurrentSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await revokeCurrentSession(request);
    await clearSessionCookie();

    return authJson({
      ok: true
    });
  } catch (error) {
    return authError(error, 500);
  }
}
