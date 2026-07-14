"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { Logo } from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api("/api/auth/forgot-password", { method: "POST", body: { email } });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-10">
      <Logo size="text-3xl" gemSize={32} />
      <h1 className="display mt-8 text-[24px]">Reset your password</h1>
      {sent ? (
        <p className="alert-ok mt-6">
          If that email is registered, a reset link is on its way. It&apos;s valid for 30 minutes.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Business email</label>
            <input id="email" type="email" required className="input" placeholder="you@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="alert-error" role="alert">{error}</p>}
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-8 text-center text-sm text-ink-300">
        <Link href="/login" className="font-bold text-gold-400">Back to sign in</Link>
      </p>
    </main>
  );
}
