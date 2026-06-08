import { getMsg91Config } from "./config";

const MSG91_BASE_URL = "https://api.msg91.com/api/v5/widget";

type Msg91Result<T extends Record<string, unknown> = Record<string, unknown>> = T & {
  type?: string;
  message?: unknown;
};

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readMessage(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const message = value as Record<string, unknown>;
    return (
      readString(message.message) ??
      readString(message.error) ??
      readString(message.description) ??
      readString(message.msg)
    );
  }

  return undefined;
}

function isSuccess(result: Msg91Result) {
  const type = readString(result.type)?.toLowerCase();
  const status = readString(result.status)?.toLowerCase();

  return type === "success" || status === "success";
}

async function requestMsg91<T extends Record<string, unknown>>(path: string, body: Record<string, unknown>) {
  const { MSG91_AUTH_KEY } = getMsg91Config();
  const response = await fetch(`${MSG91_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: MSG91_AUTH_KEY
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const result = (await response.json().catch(() => ({}))) as Msg91Result<T>;

  if (!response.ok || !isSuccess(result)) {
    const message = readMessage(result.message) ?? readMessage(result) ?? "MSG91 request failed";
    if (message.toLowerCase().includes("captcha")) {
      throw new Error("MSG91: Disable captcha/invisible OTP on this OTP Widget for backend API OTP flow.");
    }

    throw new Error(`MSG91: ${message}`);
  }

  return result;
}

function extractReqId(result: Msg91Result) {
  const directReqId = readString(result.reqId) ?? readString(result.requestId) ?? readString(result.request_id);

  if (directReqId) {
    return directReqId;
  }

  if (typeof result.message === "string") {
    return result.message;
  }

  if (result.message && typeof result.message === "object") {
    const message = result.message as Record<string, unknown>;
    return readString(message.reqId) ?? readString(message.requestId) ?? readString(message.request_id);
  }

  return undefined;
}

function extractAccessToken(result: Msg91Result) {
  return (
    readString(result.accessToken) ??
    readString(result.access_token) ??
    readString(result["access-token"]) ??
    (result.message && typeof result.message === "object"
      ? readString((result.message as Record<string, unknown>).accessToken) ??
        readString((result.message as Record<string, unknown>).access_token) ??
        readString((result.message as Record<string, unknown>)["access-token"])
      : undefined)
  );
}

export async function sendMsg91Otp(identifier: string) {
  const { MSG91_WIDGET_ID } = getMsg91Config();
  const result = await requestMsg91("/sendOtp", {
    widgetId: MSG91_WIDGET_ID,
    identifier
  });
  const reqId = extractReqId(result);

  if (!reqId) {
    throw new Error("MSG91 did not return a request id");
  }

  return { reqId };
}

export async function verifyMsg91Otp({
  otp,
  reqId
}: {
  otp: string;
  reqId: string;
}) {
  const { MSG91_WIDGET_ID } = getMsg91Config();
  const result = await requestMsg91("/verifyOtp", {
    widgetId: MSG91_WIDGET_ID,
    reqId,
    otp
  });

  return {
    accessToken: extractAccessToken(result),
    raw: result
  };
}

export async function verifyMsg91AccessToken(accessToken: string) {
  const result = await requestMsg91("/verifyAccessToken", {
    "access-token": accessToken
  });

  const message = result.message && typeof result.message === "object" ? result.message : result;
  const data = message as Record<string, unknown>;

  return {
    identifier:
      readString(data.identifier) ??
      readString(data.mobile) ??
      readString(data.phone) ??
      readString(data.number) ??
      readString(data.user_identifier),
    raw: result
  };
}
