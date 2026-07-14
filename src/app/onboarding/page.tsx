import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingForm } from "@/components/OnboardingForm";

export const metadata: Metadata = { title: "Company details" };

/** Only reached by legacy accounts created before simplified signup. */
export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const profile = await db.businessProfile.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (profile) redirect("/discover");

  return <OnboardingForm />;
}
