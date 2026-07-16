import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody, requireSession } from "@/lib/api";
import { verificationSchema } from "@/lib/validators";
import { hashGovernmentId } from "@/lib/crypto";
import { PROFILE_STATUS } from "@/lib/constants";
import { verificationEnabled } from "@/lib/env";
import { audit } from "@/lib/audit";

/**
 * Future verification framework — DISABLED by default. Set
 * VERIFICATION_ENABLED=true to accept document submissions; admins then
 * review them in the dashboard and approved businesses earn the
 * "Verified Business" badge. Signup never depends on this flow.
 */
export const POST = handler(async (req: Request) => {
  if (!verificationEnabled) {
    return jsonError(
      "Business verification is not open yet. Your account is fully active without it.",
      503,
    );
  }

  const session = await requireSession();
  const data = await parseBody(req, verificationSchema);

  const profile = await db.businessProfile.findUnique({ where: { userId: session.sub } });
  if (!profile) return jsonError("Complete signup first", 400);
  if (profile.status === PROFILE_STATUS.VERIFIED) {
    return jsonError("Your business is already verified", 409);
  }
  if (profile.status === PROFILE_STATUS.PENDING_VERIFICATION) {
    return jsonError("Your documents are already under review", 409);
  }

  const aadhaarHash = hashGovernmentId(data.aadhaar);
  const duplicate = await db.businessProfile.findFirst({
    where: {
      userId: { not: session.sub },
      OR: [{ gstin: data.gstin }, { aadhaarHash }],
      status: { in: [PROFILE_STATUS.PENDING_VERIFICATION, PROFILE_STATUS.VERIFIED] },
    },
    select: { id: true },
  });
  if (duplicate) {
    return jsonError("These business documents are already registered on another account", 409);
  }

  await db.businessProfile.update({
    where: { userId: session.sub },
    data: {
      gstin: data.gstin,
      pan: data.pan,
      aadhaarLast4: data.aadhaar.slice(-4),
      aadhaarHash,
      status: PROFILE_STATUS.PENDING_VERIFICATION,
      rejectionReason: null,
    },
  });
  await audit("verification.submitted", { actorId: session.sub });

  return NextResponse.json({ ok: true, message: "Documents submitted for review" }, { status: 201 });
});
