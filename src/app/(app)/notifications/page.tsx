"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, timeAgo } from "@/lib/client";
import { RowSkeletons } from "@/components/Skeletons";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

const ICONS: Record<string, string> = {
  MATCH: "🤝",
  MESSAGE: "💬",
  VERIFICATION_APPROVED: "✅",
  VERIFICATION_REJECTED: "⚠️",
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);

  useEffect(() => {
    api<{ notifications: Notification[] }>("/api/notifications")
      .then((d) => {
        setItems(d.notifications);
        return api("/api/notifications", { method: "PATCH" });
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <main className="flex flex-1 flex-col">
      <header className="px-5 pt-5 pb-3">
        <h1 className="display text-[21px]">Notifications</h1>
      </header>

      {items === null ? (
        <RowSkeletons count={5} />
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
          <div className="glow-gold flex h-20 w-20 items-center justify-center rounded-full bg-gold-500/10 text-3xl">
            🔔
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink-300">
            Nothing yet — matches and messages will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5 px-4 pb-4">
          {items.map((n, i) => {
            const inner = (
              <div
                className={`card relative flex gap-3.5 overflow-hidden p-4 ${
                  n.read ? "opacity-70" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-gold-300 to-gold-600"
                />
                <span className="w-8 shrink-0 text-center text-xl">{ICONS[n.type] ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[14.5px] font-bold">{n.title}</p>
                    <span className="shrink-0 text-[10.5px] text-ink-400 tabular-nums">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-300">{n.body}</p>
                </div>
              </div>
            );
            return (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3), ease }}
              >
                {n.href ? <Link href={n.href}>{inner}</Link> : inner}
              </motion.li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
