"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export function LogoutButton({ className = "btn-ghost" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      className={className}
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
