const requiredEnv = ["MONGODB_URI"] as const;

type RequiredEnv = (typeof requiredEnv)[number];

type AuthConfig = Record<RequiredEnv, string> & {
  mongoDbName: string;
  sessionCookieName: string;
  sessionDays: number;
};

function envValue(key: string) {
  const value = process.env[key]?.trim();

  if (!value) {
    return "";
  }

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

export function getAuthConfig(): AuthConfig {
  const missing = requiredEnv.filter((key) => !envValue(key));

  if (missing.length > 0) {
    throw new Error(`Missing auth environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
  }

  return {
    MONGODB_URI: envValue("MONGODB_URI"),
    mongoDbName: envValue("MONGODB_DB") || "sodhani",
    sessionCookieName: envValue("AUTH_SESSION_COOKIE") || "sodhani_session",
    sessionDays: Number.parseInt(envValue("AUTH_SESSION_DAYS") || "30", 10)
  };
}

export function getMsg91Config() {
  const missing = ["MSG91_AUTH_KEY", "MSG91_WIDGET_ID"].filter((key) => !envValue(key));

  if (missing.length > 0) {
    throw new Error(`Missing MSG91 environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
  }

  return {
    MSG91_AUTH_KEY: envValue("MSG91_AUTH_KEY"),
    MSG91_WIDGET_ID: envValue("MSG91_WIDGET_ID")
  };
}

export function getGoogleConfig() {
  const missing = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"].filter((key) => !envValue(key));

  if (missing.length > 0) {
    throw new Error(`Missing Google environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
  }

  const clientId = envValue("GOOGLE_CLIENT_ID");
  const extraClientIds = envValue("GOOGLE_ALLOWED_CLIENT_IDS")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: envValue("GOOGLE_CLIENT_SECRET"),
    GOOGLE_REDIRECT_URI: envValue("GOOGLE_REDIRECT_URI") || undefined,
    GOOGLE_ALLOWED_CLIENT_IDS: Array.from(new Set([clientId, ...extraClientIds]))
  };
}
