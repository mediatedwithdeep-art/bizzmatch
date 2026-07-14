"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";
import { Logo } from "@/components/Logo";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api("/api/auth/reset-password", { method: "POST", body: { token, password } });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <p className="alert-error mt-6">
        This reset link is incomplete. Request a new one from the sign-in page.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="password">New password</label>
        <input id="password" type="password" required minLength={8} className="input"
          placeholder="At least 8 characters" autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="alert-error" role="alert">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">
        {busy ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-10">
      <Logo size="text-3xl" gemSize={32} />
      <h1 className="display mt-8 text-[24px]">Choose a new password</h1>
      <Suspense>
        <ResetForm />
      </Suspense>
      <p className="mt-8 text-center text-sm text-ink-300">
        <Link href="/login" className="font-bold text-gold-400">Back to sign in</Link>
      </p>
    </main>
  );
}
