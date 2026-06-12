import type { Metadata } from "next";

import { AuthPlaceholder } from "@/components/AuthPlaceholder";

export const metadata: Metadata = {
  title: "Sign up · SAFEedge",
  description: "Create a SAFEedge account with a mobile OTP."
};

export default function SignUpPage() {
  return <AuthPlaceholder mode="sign-up" />;
}
