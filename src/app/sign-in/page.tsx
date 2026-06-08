import type { Metadata } from "next";

import { AuthPlaceholder } from "@/components/AuthPlaceholder";

export const metadata: Metadata = {
  title: "Sign in · Sodhani",
  description: "Sign in to Sodhani with a mobile OTP."
};

export default function SignInPage() {
  return <AuthPlaceholder mode="sign-in" />;
}
