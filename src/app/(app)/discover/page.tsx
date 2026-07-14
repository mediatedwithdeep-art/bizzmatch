import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { SwipeDeck } from "@/components/SwipeDeck";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const session = await getSession();
  const me = session
    ? await db.businessProfile.findUnique({
        where: { userId: session.sub },
        select: { companyName: true },
      })
    : null;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <Logo />
        <span className="overline-label">Discover</span>
      </header>
      <SwipeDeck filterQuery="" myCompany={me?.companyName ?? "You"} />
    </main>
  );
}
