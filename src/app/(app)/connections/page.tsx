"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, timeAgo } from "@/lib/client";
import { Monogram } from "@/components/BusinessCard";
import { RowSkeletons } from "@/components/Skeletons";

type ConnectionRow = {
  id: string;
  createdAt: string;
  other: {
    companyName: string;
    ownerName: string;
    industry: string;
    city: string;
    state: string;
  } | null;
  lastMessage: { body: string; createdAt: string; mine: boolean } | null;
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionRow[] | null>(null);

  useEffect(() => {
    api<{ connections: ConnectionRow[] }>("/api/connections")
      .then((d) => setConnections(d.connections))
      .catch(() => setConnections([]));
  }, []);

  return (
    <main className="flex flex-1 flex-col">
      <header className="px-5 pt-5 pb-3">
        <h1 className="display text-[21px]">Your network</h1>
        <p className="mt-0.5 text-[13px] text-ink-300">Mutual connections — chat away.</p>
      </header>

      {connections === null ? (
        <RowSkeletons count={5} />
      ) : connections.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
          <div className="glow-gold flex h-20 w-20 items-center justify-center rounded-full bg-gold-500/10 text-3xl">
            🤝
          </div>
          <h2 className="display text-lg">No connections yet</h2>
          <p className="max-w-xs text-sm leading-relaxed text-ink-300">
            When you and another business both swipe “Interested”, you&apos;ll connect and unlock chat.
          </p>
          <Link href="/discover" className="btn-primary mt-2 !px-7">Start discovering</Link>
        </div>
      ) : (
        <ul className="space-y-2.5 px-4 pb-4">
          {connections.map((c, i) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3), ease }}
            >
              <Link
                href={`/chat/${c.id}`}
                className="card flex items-center gap-3.5 p-3.5 transition-transform active:scale-[0.985]"
              >
                <Monogram name={c.other?.companyName ?? "?"} size="h-12 w-12 text-base" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[14.5px] font-bold">{c.other?.companyName ?? "Business"}</p>
                    <span className="shrink-0 text-[10.5px] text-ink-400 tabular-nums">
                      {timeAgo(c.lastMessage?.createdAt ?? c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-ink-300">
                    {c.lastMessage ? (
                      <>
                        {c.lastMessage.mine && <span className="text-ink-400">You: </span>}
                        {c.lastMessage.body}
                      </>
                    ) : (
                      `${c.other?.industry ?? ""} · ${c.other?.city ?? ""} — say hello!`
                    )}
                  </p>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </main>
  );
}
