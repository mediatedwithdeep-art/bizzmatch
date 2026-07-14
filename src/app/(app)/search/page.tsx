"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { INDUSTRIES } from "@/lib/constants";
import { SwipeDeck } from "@/components/SwipeDeck";

/**
 * Search & filters: same swipe deck, scoped by industry / city / keywords.
 * Filters apply on submit so the deck isn't refetched per keystroke.
 */
export default function SearchPage() {
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [open, setOpen] = useState(true);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (industry) params.set("industry", industry);
    if (city.trim()) params.set("city", city.trim());
    if (q.trim()) params.set("q", q.trim());
    setApplied(params.size ? `?${params}` : "");
    setOpen(false);
  }

  const activeCount = [industry, city.trim(), q.trim()].filter(Boolean).length;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="display text-[21px]">Search</h1>
        <button
          className={`chip ${activeCount ? "chip-active" : ""}`}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide filters" : `Filters${activeCount ? ` · ${activeCount}` : ""}`}
        </button>
      </header>

      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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

      <SwipeDeck key={applied} filterQuery={applied} />
    </main>
  );
}
