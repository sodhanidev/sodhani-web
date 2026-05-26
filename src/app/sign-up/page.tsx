import type { Metadata } from "next";

import { AuthPlaceholder } from "@/components/AuthPlaceholder";

export const metadata: Metadata = {
  title: "Sign up · Sodhani",
  description: "Placeholder sign-up page for Sodhani account creation."
};

export default function SignUpPage() {
  return <AuthPlaceholder mode="sign-up" />;
}
