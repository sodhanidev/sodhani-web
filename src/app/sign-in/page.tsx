import type { Metadata } from "next";

import { AuthPlaceholder } from "@/components/AuthPlaceholder";

export const metadata: Metadata = {
  title: "Sign in · SAFEedge",
  description: "Sign in to SAFEedge with a mobile OTP."
};

export default function SignInPage() {
  return <AuthPlaceholder mode="sign-in" />;
}
