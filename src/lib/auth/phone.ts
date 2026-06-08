export type NormalizedPhone = {
  e164: string;
  msg91Identifier: string;
  national: string;
};

export function normalizeIndianPhone(input: unknown): NormalizedPhone | null {
  if (typeof input !== "string") {
    return null;
  }

  const digits = input.replace(/\D/gu, "");

  if (digits.length === 10 && /^[6-9]/u.test(digits)) {
    return {
      e164: `+91${digits}`,
      msg91Identifier: `91${digits}`,
      national: digits
    };
  }

  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/u.test(digits.slice(2))) {
    return {
      e164: `+${digits}`,
      msg91Identifier: digits,
      national: digits.slice(2)
    };
  }

  return null;
}

export function maskPhone(phone: string) {
  const normalized = normalizeIndianPhone(phone);

  if (!normalized) {
    return phone;
  }

  return `+91 ${normalized.national.slice(0, 2)}••••${normalized.national.slice(-4)}`;
}
