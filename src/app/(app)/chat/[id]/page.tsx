"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { Monogram } from "@/components/BusinessCard";

type Msg = { id: string; senderId: string; body: string; createdAt: string };
type ChatData = {
  me: string;
  other: { companyName: string; ownerName: string; industry: string; city: string } | null;
  messages: Msg[];
};

const POLL_MS = 3000;

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ChatData | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTs = useRef<string | null>(null);

  const scrollDown = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const poll = useCallback(async () => {
    const url = lastTs.current
      ? `/api/connections/${id}/messages?after=${encodeURIComponent(lastTs.current)}`
      : `/api/connections/${id}/messages`;
    const fresh = await api<ChatData>(url);
    setData((prev) => {
      if (!prev || !lastTs.current) return fresh;
      if (fresh.messages.length === 0) return prev;
      const known = new Set(prev.messages.map((m) => m.id));
      const merged = [...prev.messages, ...fresh.messages.filter((m) => !known.has(m.id))];
      return { ...prev, messages: merged };
    });
    const newest = fresh.messages.at(-1);
    if (newest) {
      lastTs.current = newest.createdAt;
      setTimeout(scrollDown, 50);
    }
  }, [id]);

  useEffect(() => {
    poll().catch(() => setError("Could not load this conversation"));
    const t = setInterval(() => poll().catch(() => {}), POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    try {
      const { message } = await api<{ message: Msg }>(`/api/connections/${id}/messages`, {
        method: "POST",
        body: { body },
      });
      setData((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
      lastTs.current = message.createdAt;
      setTimeout(scrollDown, 50);
    } catch (err) {
      setText(body);
      setError(err instanceof Error ? err.message : "Failed to send");
    }
  }

  if (error && !data) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-ink-300">{error}</p>
        <Link href="/connections" className="btn-ghost">Back to network</Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="glass sticky top-0 z-10 flex items-center gap-3 !rounded-none px-4 py-3">
        <Link href="/connections" aria-label="Back" className="px-1 text-[26px] leading-none text-ink-300">
          ‹
        </Link>
        {data?.other ? (
          <>
            <Monogram name={data.other.companyName} size="h-10 w-10 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-[15px] leading-tight font-bold">{data.other.companyName}</p>
              <p className="truncate text-[11.5px] text-ink-400">
                {data.other.industry} · {data.other.city}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-[13px]" />
            <div className="space-y-1.5">
              <div className="skeleton h-3.5 w-36" />
              <div className="skeleton h-2.5 w-24" />
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {data?.messages.length === 0 && (
          <p className="px-8 py-8 text-center text-[13px] leading-relaxed text-ink-400">
            You&apos;re connected with {data.other?.ownerName ?? "them"} — introduce your business 👋
          </p>
        )}
        {data?.messages.map((m) => {
          const mine = m.senderId === data.me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-[18px] px-3.5 py-2.5 text-[14.5px] leading-relaxed break-words whitespace-pre-wrap ${
                  mine
                    ? "rounded-br-md bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950 shadow-[0_4px_14px_rgba(139,92,246,0.3)]"
                    : "rounded-bl-md bg-ink-800 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
                }`}
              >
                {m.body}
                <div className={`mt-1 text-[9.5px] tabular-nums ${mine ? "text-ink-800/80" : "text-ink-400"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && data && <p className="px-4 pb-1 text-xs text-rose-500">{error}</p>}

      <form onSubmit={send} className="glass flex gap-2.5 !rounded-none px-4 py-3">
        <input
          className="input flex-1 !rounded-full"
          placeholder="Write a message…"
          value={text}
          maxLength={2000}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
        />
        <button
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-lg text-ink-950 shadow-[0_6px_18px_rgba(139,92,246,0.35)] transition-transform active:scale-90 disabled:opacity-50"
          disabled={!text.trim()}
          aria-label="Send"
        >
          ➤
        </button>
      </form>
    </main>
  );
}
