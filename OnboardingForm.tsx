"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/client";
import { INDUSTRIES } from "@/lib/constants";
import { Logo } from "./Logo";

/** One-step company details for accounts that don't have a profile yet. */
export function OnboardingForm() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: "", industry: "", country: "India", city: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { next } = await api<{ next: string }>("/api/profile", { method: "POST", body: form });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Logo />
        <h1 className="display mt-8 text-[24px]">Your company</h1>
        <p className="mt-1 text-[14px] text-ink-300">
          Four quick facts and you&apos;re in — everything else is optional.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="label">Company name</label>
            <input required minLength={2} className="input" placeholder="Acme Traders Pvt Ltd"
              value={form.companyName} onChange={set("companyName")} />
          </div>
          <div>
            <label className="label">Industry</label>
            <select required className="input" value={form.industry} onChange={set("industry")}>
              <option value="" disabled>Select industry</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Country</label>
              <input required minLength={2} className="input" placeholder="India"
                value={form.country} onChange={set("country")} />
            </div>
            <div>
              <label className="label">City</label>
              <input required minLength={2} className="input" placeholder="Mumbai"
                value={form.city} onChange={set("city")} />
            </div>
          </div>

          {error && <p className="alert-error" role="alert">{error}</p>}

          <button disabled={busy} className="btn-primary w-full !py-3.5">
            {busy ? "Saving…" : "Enter the network"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
