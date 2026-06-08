import type { NextRequest } from "next/server";

import { authJson } from "@/lib/auth/api";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    return authJson({
      ok: true,
      user
    });
  } catch {
    return authJson({
      ok: true,
      user: null
    });
  }
}
