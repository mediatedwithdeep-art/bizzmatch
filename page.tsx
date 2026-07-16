"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/client";
import { toast } from "@/components/Toaster";
import { Monogram } from "@/components/BusinessCard";
import { VerifiedBadge } from "@/components/Logo";
import { RowSkeletons } from "@/components/Skeletons";
import { INDUSTRIES } from "@/lib/constants";

type Person = {
  userId: string;
  companyName: string;
  ownerName: string;
  industry: string;
  country: string;
  city: string;
  state: string | null;
  about: string | null;
  products: string | null;
  goals: string | null;
  verified: boolean;
};

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Browse every business and message anyone directly — no swipe/match required.
 * Tap a card to expand the full profile; tap Message to open a live chat.
 */
export default function SearchPage() {
  const router = useRouter();
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<Person[] | null>(null);
  const [openFilters, setOpenFilters] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (params: URLSearchParams) => {
    setPeople(null);
    try {
      const { people } = await api<{ people: Person[] }>(`/api/people?${params}`);
      setPeople(people);
    } catch {
      setPeople([]);
      toast("Could not load businesses", "error");
    }
  }, []);

  useEffect(() => {
    load(new URLSearchParams());
  }, [load]);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (industry) params.set("industry", industry);
    if (city.trim()) params.set("city", city.trim());
    if (q.trim()) params.set("q", q.trim());
    load(params);
    setOpenFilters(false);
  }

  async function message(userId: string) {
    setBusyId(userId);
    try {
      const { connectionId } = await api<{ connectionId: string }>("/api/conversations", {
        method: "POST",
        body: { targetUserId: userId },
      });
      router.push(`/chat/${connectionId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not open chat", "error");
      setBusyId(null);
    }
  }

  const activeCount = [industry, city.trim(), q.trim()].filter(Boolean).length;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="display text-[21px]">Browse &amp; message</h1>
        <button
          className={`chip ${activeCount ? "chip-active" : ""}`}
          onClick={() => setOpenFilters((o) => !o)}
        >
          {openFilters ? "Hide filters" : `Filters${activeCount ? ` · ${activeCount}` : ""}`}
        </button>
      </header>

      <AnimatePresence initial={false}>
        {openFilters && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease }}
            onSubmit={apply}
            className="overflow-hidden px-5"
          >
            <div className="space-y-3 pb-4">
              <input
                className="input"
                placeholder="Keywords — products, goals, company…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <select className="input" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">All industries</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full">Apply filters</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {people === null ? (
        <RowSkeletons count={5} />
      ) : people.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
          <div className="glow-gold flex h-20 w-20 items-center justify-center rounded-full bg-gold-500/10 text-3xl">
            🔍
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink-300">
            No businesses match. Try clearing the filters.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5 px-4 pb-4">
          {people.map((p, i) => {
            const isOpen = expanded === p.userId;
            return (
              <motion.li
                key={p.userId}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3), ease }}
                className="card overflow-hidden"
              >
                <button
                  className="flex w-full items-center gap-3.5 p-3.5 text-left"
                  onClick={() => setExpanded(isOpen ? null : p.userId)}
                >
                  <Monogram name={p.companyName} size="h-12 w-12 text-base" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14.5px] font-bold">{p.companyName}</p>
                      {p.verified && <VerifiedBadge />}
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-ink-300">
                      {p.industry} · {[p.city, p.state ?? p.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <span className={`text-ink-400 transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 px-3.5 pb-3.5">
                        <p className="text-[12.5px] text-ink-400">Owner: {p.ownerName}</p>
                        {p.about && (
                          <div>
                            <h3 className="sec-label">About</h3>
                            <p className="text-[13.5px] leading-relaxed text-ink-200">{p.about}</p>
                          </div>
                        )}
                        {p.products && (
                          <div>
                            <h3 className="sec-label">Products &amp; services</h3>
                            <p className="text-[13.5px] leading-relaxed text-ink-200">{p.products}</p>
                          </div>
                        )}
                        {p.goals && (
                          <div>
                            <h3 className="sec-label">Looking for</h3>
                            <p className="text-[13.5px] leading-relaxed text-ink-200">{p.goals}</p>
                          </div>
                        )}
                        <button
                          className="btn-primary w-full"
                          disabled={busyId === p.userId}
                          onClick={() => message(p.userId)}
                        >
                          {busyId === p.userId ? "Opening…" : "💬 Message"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
