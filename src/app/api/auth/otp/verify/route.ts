import type { NextRequest } from "next/server";

import { ObjectId } from "mongodb";

import { authError, authJson, readJsonBody } from "@/lib/auth/api";
import { createAuthSession, setSessionCookie, upsertUserFromPhone, authUserFromDocument } from "@/lib/auth/session";
import { ensureAuthIndexes, getAuthDb } from "@/lib/auth/mongo";
import { verifyMsg91Otp } from "@/lib/auth/msg91";
import { normalizeIndianPhone } from "@/lib/auth/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OtpChallengeDocument = {
  phoneE164: string;
  phoneNational: string;
  msg91Identifier: string;
  reqId: string;
  createdAt: Date;
  expiresAt: Date;
  consumedAt?: Date;
  attempts?: number;
  status: "sent" | "verified";
};

function shouldReturnSessionToken(clientType: unknown) {
  return clientType === "mobile";
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const phone = normalizeIndianPhone(body?.phone);
    const reqId = typeof body?.reqId === "string" ? body.reqId.trim() : "";
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
    const displayName = typeof body?.name === "string" ? body.name : undefined;

    if (!phone) {
      return authError(new Error("Enter a valid Indian mobile number."), 422);
    }

    if (!reqId) {
      return authError(new Error("Missing OTP request id."), 422);
    }

    if (!/^\d{4,8}$/u.test(otp)) {
      return authError(new Error("Enter the OTP code from SMS."), 422);
    }

    await ensureAuthIndexes();

    const db = await getAuthDb();
    const challenges = db.collection<OtpChallengeDocument>("otp_challenges");
    const challenge = await challenges.findOne({
      phoneE164: phone.e164,
      reqId,
      consumedAt: { $exists: false },
      expiresAt: { $gt: new Date() }
    });

    if (!challenge) {
      return authError(new Error("This OTP request has expired. Request a new code."), 410);
    }

    if ((challenge.attempts ?? 0) >= 5) {
      return authError(new Error("Too many verification attempts. Request a new code."), 429);
    }

    await challenges.updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } });

    await verifyMsg91Otp({ reqId, otp });

    await challenges.updateOne(
      { _id: challenge._id },
      {
        $set: {
          consumedAt: new Date(),
          status: "verified"
        }
      }
    );

    const user = await upsertUserFromPhone({
      displayName,
      phoneE164: phone.e164,
      phoneNational: phone.national
    });
    const session = await createAuthSession(user._id as ObjectId, request);

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
