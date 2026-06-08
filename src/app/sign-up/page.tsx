import type { Metadata } from "next";

import { AuthPlaceholder } from "@/components/AuthPlaceholder";

export const metadata: Metadata = {
  title: "Sign up · Sodhani",
  description: "Create a Sodhani account with a mobile OTP."
};

export default function SignUpPage() {
  return <AuthPlaceholder mode="sign-up" />;
}
