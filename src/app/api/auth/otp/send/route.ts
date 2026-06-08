import type { NextRequest } from "next/server";

import { authError, authJson, readJsonBody } from "@/lib/auth/api";
import { ensureAuthIndexes, getAuthDb } from "@/lib/auth/mongo";
import { sendMsg91Otp } from "@/lib/auth/msg91";
import { maskPhone, normalizeIndianPhone } from "@/lib/auth/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OtpChallengeDocument = {
  phoneE164: string;
  phoneNational: string;
  msg91Identifier: string;
  reqId: string;
  createdAt: Date;
  expiresAt: Date;
  status: "sent" | "verified";
};

const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 10 * 60 * 1000;
const CHALLENGE_TTL_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const phone = normalizeIndianPhone(body?.phone);

    if (!phone) {
      return authError(new Error("Enter a valid Indian mobile number."), 422);
    }

    await ensureAuthIndexes();

    const db = await getAuthDb();
    const challenges = db.collection<OtpChallengeDocument>("otp_challenges");
    const now = new Date();
    const recentSends = await challenges.countDocuments({
      phoneE164: phone.e164,
      createdAt: { $gt: new Date(now.getTime() - SEND_WINDOW_MS) }
    });

    if (recentSends >= MAX_SENDS_PER_WINDOW) {
      return authError(new Error("Too many OTP requests. Try again in a few minutes."), 429);
    }

    const { reqId } = await sendMsg91Otp(phone.msg91Identifier);

    await challenges.insertOne({
      phoneE164: phone.e164,
      phoneNational: phone.national,
      msg91Identifier: phone.msg91Identifier,
      reqId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS),
      status: "sent"
    });

    return authJson({
      ok: true,
      reqId,
      phone: maskPhone(phone.e164)
    });
  } catch (error) {
    return authError(error, error instanceof Error && error.message.startsWith("MSG91:") ? 502 : 500);
  }
}
