"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

const TABS = [
  { href: "/discover", label: "Discover", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { href: "/search", label: "Browse", icon: "M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" },
  {
    href: "/connections",
    label: "Messages",
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  },
  {
    href: "/notifications",
    label: "Alerts",
    icon: "M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const { unread } = await api<{ unread: number }>("/api/notifications");
        if (!cancelled) setUnread(unread);
      } catch {
        /* polling */
      }
    }
    poll();
    const t = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pathname]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-md px-3.5 pb-[max(12px,env(safe-area-inset-bottom))]">
        <nav className="glass flex !rounded-[22px] p-1.5">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[9.5px] font-bold transition-colors duration-200 ${
                  active ? "bg-gold-500/10 text-gold-300" : "text-ink-400 hover:text-ink-200"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[22px] w-[22px]"
                  aria-hidden
                >
                  <path d={tab.icon} />
                </svg>
                {tab.label}
                {active && (
                  <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-gold-400" />
                )}
                {tab.href === "/notifications" && unread > 0 && (
                  <span className="absolute top-1 left-[calc(50%+7px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a92] to-rose-500 px-1 text-[9px] font-extrabold text-white shadow-[0_2px_8px_rgba(251,113,133,0.5)] tabular-nums">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
