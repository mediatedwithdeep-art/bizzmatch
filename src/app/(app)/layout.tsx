import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ADMIN_ROLES, PROFILE_STATUS } from "@/lib/constants";
import { BottomNav } from "@/components/BottomNav";

/**
 * Shell for members. No approval gate — signup lands here directly.
 * Legacy accounts without a profile finish company details first;
 * suspended accounts are shown the door.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if ((ADMIN_ROLES as string[]).includes(session.role)) redirect("/admin");

  const profile = await db.businessProfile.findUnique({
    where: { userId: session.sub },
    select: { status: true },
  });
  if (!profile) redirect("/onboarding");
  if (profile.status === PROFILE_STATUS.SUSPENDED) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col pb-[86px]">{children}</div>
      <BottomNav />
    </div>
  );
}
