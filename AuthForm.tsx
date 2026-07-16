"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/client";
import { INDUSTRIES } from "@/lib/constants";
import { Logo } from "./Logo";

const ease = [0.22, 1, 0.36, 1] as const;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    industry: "",
    country: "India",
    city: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body =
        mode === "login" ? { email: form.email, password: form.password } : form;
      const { next } = await api<{ next: string }>(`/api/auth/${mode}`, {
        method: "POST",
        body,
      });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <main className="relative flex-1 overflow-x-clip px-6 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="float-slow absolute -top-10 right-[-70px] h-52 w-52 rounded-full bg-gold-500/12 blur-3xl" />
        <div className="float-slower absolute bottom-10 left-[-80px] h-56 w-56 rounded-full bg-teal-500/7 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="flex min-h-full flex-col justify-center"
      >
        <Link href="/" aria-label="BizMatch home">
          <Logo size="text-3xl" gemSize={32} />
        </Link>
        <h1 className="display mt-8 text-[26px]">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-[14.5px] text-ink-300">
          {mode === "login"
            ? "Sign in to continue networking."
            : "Straight to the network — no waiting, no documents."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="label" htmlFor="name">Your name</label>
              <input id="name" required minLength={2} className="input" placeholder="Full name"
                autoComplete="name" value={form.name} onChange={set("name")} />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Business email</label>
            <input id="email" type="email" required autoComplete="email" className="input"
              placeholder="you@company.com" value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                minLength={mode === "signup" ? 8 : 1}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="input !pr-12"
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                value={form.password}
                onChange={set("password")}
              />
              <button
                type="button"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw((s) => !s)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-lg text-ink-400 hover:text-ink-200"
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <>
              <div>
                <label className="label" htmlFor="companyName">Company name</label>
                <input id="companyName" required minLength={2} className="input"
                  placeholder="Acme Traders Pvt Ltd" autoComplete="organization"
                  value={form.companyName} onChange={set("companyName")} />
              </div>
              <div>
                <label className="label" htmlFor="industry">Industry</label>
                <select id="industry" required className="input" value={form.industry} onChange={set("industry")}>
                  <option value="" disabled>Select industry</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="country">Country</label>
                  <input id="country" required minLength={2} className="input" placeholder="India"
                    value={form.country} onChange={set("country")} />
                </div>
                <div>
                  <label className="label" htmlFor="city">City</label>
                  <input id="city" required minLength={2} className="input" placeholder="Mumbai"
                    value={form.city} onChange={set("city")} />
                </div>
              </div>
            </>
          )}

          {error && (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="alert-error" role="alert">
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full !py-3.5">
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account & start"}
          </button>
        </form>

        <div className="mt-8 space-y-2 text-center text-sm text-ink-300">
          {mode === "login" ? (
            <>
              <p>
                New to BizMatch?{" "}
                <Link href="/signup" className="font-bold text-gold-400">Create an account</Link>
              </p>
              <p>
                <Link href="/forgot-password" className="text-ink-400 underline underline-offset-4">
                  Forgot password?
                </Link>
              </p>
            </>
          ) : (
            <p>
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-gold-400">Sign in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </main>
  );
}
