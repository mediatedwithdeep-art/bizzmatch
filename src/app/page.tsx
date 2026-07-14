import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LandingHero } from "@/components/LandingHero";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/discover");
  return <LandingHero />;
}
