import type { Metadata } from "next";

import { AuthPlaceholder } from "@/components/AuthPlaceholder";

export const metadata: Metadata = {
  title: "Sign in · Sodhani",
  description: "Placeholder sign-in page for Sodhani account access."
};

export default function SignInPage() {
  return <AuthPlaceholder mode="sign-in" />;
}
