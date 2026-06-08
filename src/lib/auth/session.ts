import { createHash, randomBytes } from "node:crypto";

import { ObjectId, type WithId } from "mongodb";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getAuthConfig } from "./config";
import { ensureAuthIndexes, getAuthDb } from "./mongo";

export type AuthUser = {
  id: string;
  phoneE164?: string;
  phoneNational?: string;
  email?: string;
  avatarUrl?: string;
  displayName?: string;
};

type UserDocument = {
  phoneE164?: string;
  phoneNational?: string;
  email?: string;
  emailNorm?: string;
  googleSub?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  displayName?: string;
};

type SessionDocument = {
  userId: ObjectId;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  ip?: string;
};

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionMaxAgeSeconds() {
  return getAuthConfig().sessionDays * 24 * 60 * 60;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds(),
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export function authUserFromDocument(user: WithId<UserDocument>): AuthUser {
  return {
    id: user._id.toHexString(),
    phoneE164: user.phoneE164,
    phoneNational: user.phoneNational,
    email: user.email,
    avatarUrl: user.avatarUrl,
    displayName: user.displayName
  };
}

function readRequestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined
  );
}

export async function upsertUserFromPhone({
  displayName,
  phoneE164,
  phoneNational
}: {
  displayName?: string;
  phoneE164: string;
  phoneNational: string;
}) {
  await ensureAuthIndexes();

  const db = await getAuthDb();
  const users = db.collection<UserDocument>("users");
  const now = new Date();
  const cleanDisplayName = displayName?.trim();

  await users.updateOne(
    { phoneE164 },
    {
      $set: {
        phoneE164,
        phoneNational,
        updatedAt: now,
        lastLoginAt: now,
        ...(cleanDisplayName ? { displayName: cleanDisplayName } : {})
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  const user = await users.findOne({ phoneE164 });

  if (!user) {
    throw new Error("Unable to create user");
  }

  return user;
}

export async function upsertUserFromGoogle({
  avatarUrl,
  displayName,
  email,
  googleSub
}: {
  avatarUrl?: string;
  displayName?: string;
  email: string;
  googleSub: string;
}) {
  await ensureAuthIndexes();

  const db = await getAuthDb();
  const users = db.collection<UserDocument>("users");
  const now = new Date();
  const emailNorm = email.trim().toLowerCase();
  const cleanDisplayName = displayName?.trim();

  await users.updateOne(
    {
      $or: [{ googleSub }, { emailNorm }]
    },
    {
      $set: {
        email,
        emailNorm,
        googleSub,
        updatedAt: now,
        lastLoginAt: now,
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(cleanDisplayName ? { displayName: cleanDisplayName } : {})
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  const user = await users.findOne({ googleSub });

  if (!user) {
    throw new Error("Unable to create Google user");
  }

  return user;
}

export async function createAuthSession(userId: ObjectId, request: NextRequest) {
  await ensureAuthIndexes();

  const db = await getAuthDb();
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionMaxAgeSeconds() * 1000);

  await db.collection<SessionDocument>("auth_sessions").insertOne({
    userId,
    tokenHash: hashSessionToken(token),
    createdAt: now,
    expiresAt,
    lastSeenAt: now,
    userAgent: request.headers.get("user-agent") ?? undefined,
    ip: readRequestIp(request)
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(getAuthConfig().sessionCookieName, token, sessionCookieOptions());
}

export function setSessionCookieOnResponse(response: NextResponse, token: string) {
  response.cookies.set(getAuthConfig().sessionCookieName, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(getAuthConfig().sessionCookieName, "", {
    ...sessionCookieOptions(),
    maxAge: 0
  });
}

export async function getSessionTokenFromRequest(request?: NextRequest) {
  const bearer = request?.headers.get("authorization")?.match(/^Bearer\s+(.+)$/iu)?.[1];

  if (bearer) {
    return bearer;
  }

  const cookieStore = await cookies();
  return cookieStore.get(getAuthConfig().sessionCookieName)?.value;
}

export async function getCurrentUser(request?: NextRequest): Promise<AuthUser | null> {
  const token = await getSessionTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const db = await getAuthDb();
  const session = await db.collection<SessionDocument>("auth_sessions").findOne({
    tokenHash: hashSessionToken(token),
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    return null;
  }

  const user = await db.collection<UserDocument>("users").findOne({ _id: session.userId });

  if (!user) {
    return null;
  }

  await db.collection<SessionDocument>("auth_sessions").updateOne(
    { _id: session._id },
    {
      $set: {
        lastSeenAt: new Date()
      }
    }
  );

  return authUserFromDocument(user);
}

export async function revokeCurrentSession(request: NextRequest) {
  const token = await getSessionTokenFromRequest(request);

  if (!token) {
    return;
  }

  const db = await getAuthDb();

  await db.collection<SessionDocument>("auth_sessions").updateOne(
    { tokenHash: hashSessionToken(token), revokedAt: { $exists: false } },
    {
      $set: {
        revokedAt: new Date()
      }
    }
  );
}
