"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { api } from "@/lib/client";
import { toast } from "./Toaster";
import { BusinessCard, Monogram, type DiscoverProfile } from "./BusinessCard";
import { Confetti } from "./Confetti";
import { DeckSkeleton } from "./Skeletons";

type MatchInfo = { connectionId: string; company: string };
type Direction = "INTERESTED" | "SKIP";
const ease = [0.22, 1, 0.36, 1] as const;

export function SwipeDeck({
  filterQuery,
  myCompany = "You",
}: {
  filterQuery: string;
  myCompany?: string;
}) {
  const [deck, setDeck] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState<Direction | null>(null);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [lastSkipped, setLastSkipped] = useState<DiscoverProfile | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const yesOpacity = useTransform(x, [12, 110], [0, 1]);
  const noOpacity = useTransform(x, [-110, -12], [1, 0]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { profiles } = await api<{ profiles: DiscoverProfile[] }>(`/api/discover${filterQuery}`);
      setDeck(profiles);
    } catch {
      toast("Could not load businesses", "error");
    } finally {
      setLoading(false);
    }
  }, [filterQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const top = deck[0];

  const decide = useCallback(
    (direction: Direction) => {
      if (!top || exiting) return;
      setExiting(direction);
      // Fire the API in parallel with the exit animation.
      api<{ match: boolean; connectionId?: string; matchedCompany?: string }>("/api/swipes", {
        method: "POST",
        body: { targetUserId: top.userId, direction },
      })
        .then((res) => {
          if (res.match && res.connectionId) {
            setMatch({
              connectionId: res.connectionId,
              company: res.matchedCompany ?? top.companyName,
            });
            setLastSkipped(null);
          } else {
            setLastSkipped(direction === "SKIP" ? top : null);
          }
        })
        .catch(() => toast("Swipe didn't save — it will reappear later", "error"));
    },
    [top, exiting],
  );

  function advance() {
    setDeck((d) => d.slice(1));
    setExiting(null);
    x.set(0);
  }

  function rewind() {
    if (!lastSkipped) return;
    setDeck((d) => [lastSkipped, ...d]);
    toast(`${lastSkipped.companyName} is back`);
    setLastSkipped(null);
  }

  if (loading) return <DeckSkeleton />;

  if (!top) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
        <div className="glow-gold flex h-20 w-20 items-center justify-center rounded-full bg-gold-500/10 text-3xl">
          🌍
        </div>
        <h2 className="display text-lg">You&apos;re all caught up</h2>
        <p className="max-w-xs text-sm leading-relaxed text-ink-300">
          No more businesses match right now. Adjust filters or check back soon.
        </p>
        <button className="btn-ghost mt-2" onClick={load}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-3">
      <div className="relative min-h-0 flex-1">
        {deck[1] && (
          <div className="pointer-events-none absolute inset-0 translate-y-3.5 scale-[0.945] opacity-55">
            <BusinessCard profile={deck[1]} />
          </div>
        )}

        <motion.div
          key={top.userId}
          className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
          style={{ x, rotate }}
          drag={!exiting}
          dragElastic={0.9}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 90 || info.velocity.x > 600) decide("INTERESTED");
            else if (info.offset.x < -90 || info.velocity.x < -600) decide("SKIP");
          }}
          initial={{ scale: 0.945, y: 14, opacity: 0.55 }}
          animate={
            exiting
              ? {
                  x: exiting === "INTERESTED" ? 480 : -480,
                  rotate: exiting === "INTERESTED" ? 18 : -18,
                  opacity: 0,
                  scale: 1,
                  y: 0,
                  transition: { duration: 0.32, ease: "easeIn" },
                }
              : { scale: 1, y: 0, opacity: 1, transition: { duration: 0.3, ease } }
          }
          onAnimationComplete={() => {
            if (exiting) advance();
          }}
        >
          <BusinessCard profile={top} />
          <motion.div
            style={{ opacity: exiting === "INTERESTED" ? 1 : yesOpacity }}
            className="pointer-events-none absolute top-5 left-4 z-10 rotate-[-12deg] rounded-[10px] border-[3px] border-teal-500 bg-teal-500/10 px-3.5 py-1 text-lg font-black tracking-[0.16em] text-teal-500 backdrop-blur-[2px]"
          >
            INTERESTED
          </motion.div>
          <motion.div
            style={{ opacity: exiting === "SKIP" ? 1 : noOpacity }}
            className="pointer-events-none absolute top-5 right-4 z-10 rotate-[12deg] rounded-[10px] border-[3px] border-rose-500 bg-rose-500/10 px-3.5 py-1 text-lg font-black tracking-[0.16em] text-rose-500 backdrop-blur-[2px]"
          >
            SKIP
          </motion.div>
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-4 pt-4 pb-1">
        <button
          aria-label="Rewind last skip"
          onClick={rewind}
          disabled={!lastSkipped}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-800 text-lg text-ink-300 shadow-[0_6px_18px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.07)] transition-transform active:scale-90 disabled:opacity-35"
        >
          ⟲
        </button>
        <button
          aria-label="Skip"
          onClick={() => decide("SKIP")}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-800 text-2xl text-rose-500 shadow-[0_10px_26px_rgba(244,83,110,0.14),0_0_0_1.5px_rgba(244,83,110,0.5)] transition-transform active:scale-90"
        >
          ✕
        </button>
        <button
          aria-label="Interested"
          onClick={() => decide("INTERESTED")}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/25 to-teal-500/5 text-[26px] shadow-[0_10px_26px_rgba(46,224,175,0.16),0_0_0_1.5px_rgba(46,224,175,0.55)] transition-transform active:scale-90"
        >
          🤝
        </button>
        <div className="h-12 w-12" aria-hidden />
      </div>

      <AnimatePresence>
        {match && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 px-8 backdrop-blur-md"
          >
            <Confetti />
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.42, ease: [0.3, 1.5, 0.55, 1] }}
              className="relative w-full max-w-sm text-center"
            >
              <div className="mb-1 flex justify-center">
                <div className="z-10 translate-x-2 -rotate-8">
                  <Monogram name={myCompany} size="h-[76px] w-[76px] text-[26px]" />
                </div>
                <div className="-translate-x-2 rotate-8">
                  <Monogram name={match.company} size="h-[76px] w-[76px] text-[26px]" />
                </div>
              </div>
              <div className="mt-2 text-4xl">🤝</div>
              <h2 className="display grad-text mt-2 text-3xl">It&apos;s a connection!</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-200">
                You and <span className="font-bold">{match.company}</span> are interested in each
                other. Chat is now unlocked.
              </p>
              <div className="mt-6 space-y-2.5">
                <Link href={`/chat/${match.connectionId}`} className="btn-primary w-full">
                  Say hello
                </Link>
                <button className="btn-ghost w-full" onClick={() => setMatch(null)}>
                  Keep swiping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
