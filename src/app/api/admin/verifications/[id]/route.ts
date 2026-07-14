import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody, requireAdmin } from "@/lib/api";
import { adminDecisionSchema } from "@/lib/validators";
import { NOTIFICATION_TYPE, PROFILE_STATUS } from "@/lib/constants";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

/** Approve or reject a verification application (future framework). */
export const POST = handler(async (req: Request, { params }: Ctx) => {
  const session = await requireAdmin();
  const { id } = await params;
  const { action, reason } = await parseBody(req, adminDecisionSchema);

  const profile = await db.businessProfile.findUnique({ where: { id } });
  if (!profile) return jsonError("Application not found", 404);
  if (profile.status !== PROFILE_STATUS.PENDING_VERIFICATION) {
    return jsonError("This application has already been decided", 409);
  }

  if (action === "APPROVE") {
    await db.businessProfile.update({
      where: { id },
      data: { status: PROFILE_STATUS.VERIFIED, verifiedAt: new Date(), rejectionReason: null },
    });
    await db.notification.create({
      data: {
        userId: profile.userId,
        type: NOTIFICATION_TYPE.VERIFICATION_APPROVED,
        title: "You're verified 🎉",
        body: `${profile.companyName} now carries the Verified Business badge.`,
        href: "/profile",
      },
    });
  } else {
    await db.businessProfile.update({
      where: { id },
      data: {
        status: PROFILE_STATUS.ACTIVE, // stays fully usable — verification is optional
        rejectionReason: reason || "Documents could not be verified",
      },
    });
    await db.notification.create({
      data: {
        userId: profile.userId,
        type: NOTIFICATION_TYPE.VERIFICATION_REJECTED,
        title: "Verification unsuccessful",
        body: reason || "Your documents could not be verified. You can resubmit anytime.",
        href: "/profile",
      },
    });
  }

  await audit(`admin.verification.${action.toLowerCase()}`, {
    actorId: session.sub,
    targetId: profile.userId,
    meta: { profileId: id, reason },
  });
  return NextResponse.json({ ok: true });
});
