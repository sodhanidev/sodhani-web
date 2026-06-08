import { NextResponse } from "next/server";

export function authJson<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function authError(error: unknown, status = 400) {
  const message =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "Authentication is temporarily unavailable."
      : error instanceof Error
        ? error.message
        : "Unable to complete request";

  return authJson(
    {
      error: message
    },
    { status }
  );
}

export async function readJsonBody(request: Request) {
  return (await request.json().catch(() => null)) as Record<string, unknown> | null;
}
