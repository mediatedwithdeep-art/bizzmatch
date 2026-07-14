import { redirect } from "next/navigation";

/** Legacy route from the approval-gate era — everyone is active now. */
export default function PendingPage() {
  redirect("/discover");
}
