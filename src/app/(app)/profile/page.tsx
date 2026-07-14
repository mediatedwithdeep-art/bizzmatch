"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { INDUSTRIES } from "@/lib/constants";
import { Monogram } from "@/components/BusinessCard";
import { VerifiedBadge } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { ProfileSkeleton } from "@/components/Skeletons";
import { toast } from "@/components/Toaster";

type ProfileData = {
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  completeness: { score: number; missing: string[] };
  profile: {
    companyName: string;
    industry: string;
    country: string;
    city: string;
    state: string | null;
    about: string | null;
    products: string | null;
    goals: string | null;
    website: string | null;
    size: string | null;
    status: string;
    gstin: string | null;
    pan: string | null;
    aadhaarLast4: string | null;
  } | null;
};

type EditableFields = {
  companyName: string;
  industry: string;
  country: string;
  city: string;
  state: string;
  about: string;
  products: string;
  goals: string;
  website: string;
  size: string;
};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableFields | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => api<ProfileData>("/api/profile").then(setData).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const p = data?.profile;

  function startEdit() {
    if (!p) return;
    setForm({
      companyName: p.companyName,
      industry: p.industry,
      country: p.country,
      city: p.city,
      state: p.state ?? "",
      about: p.about ?? "",
      products: p.products ?? "",
      goals: p.goals ?? "",
      website: p.website ?? "",
      size: p.size ?? "",
    });
    setError(null);
    setEditing(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/profile", { method: "PUT", body: form });
      await load();
      setEditing(false);
      toast("Profile updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  if (!data || !p) {
    return (
      <main className="flex-1 pt-5">
        <header className="px-5 pb-3">
          <h1 className="display text-[21px]">Profile</h1>
        </header>
        <ProfileSkeleton />
      </main>
    );
  }

  const { score, missing } = data.completeness;

  return (
    <main className="flex-1 space-y-4 px-5 py-5">
      <header className="flex items-center gap-4">
        <Monogram name={p.companyName} />
        <div className="min-w-0 flex-1">
          <h1 className="display truncate text-xl">{p.companyName}</h1>
          <p className="truncate text-[13px] text-ink-300">
            {data.name} · {data.email}
          </p>
          {p.status === "VERIFIED" ? (
            <VerifiedBadge className="mt-1" />
          ) : (
            <span className="chip mt-1 !text-[10.5px]">Active member</span>
          )}
        </div>
      </header>

      {/* completeness */}
      <section className="card space-y-2.5 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[14px] font-bold">Profile completeness</h2>
          <span className="grad-text text-lg font-extrabold tabular-nums">{score}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-900" role="progressbar" aria-valuenow={score}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-600 transition-all duration-700"
            style={{ width: `${score}%` }}
          />
        </div>
        {missing.length > 0 && (
          <p className="text-[12.5px] leading-relaxed text-ink-400">
            Boost your visibility: add {missing.slice(0, 3).join(", ").toLowerCase()}
            {missing.length > 3 ? "…" : "."}
          </p>
        )}
      </section>

      {error && <p className="alert-error" role="alert">{error}</p>}

      {!editing ? (
        <>
          <section className="card space-y-3.5 p-4">
            <Row label="Industry" value={p.industry} />
            <Row label="Location" value={[p.city, p.state, p.country].filter(Boolean).join(", ")} />
            {p.size && <Row label="Company size" value={p.size} />}
            {p.website && <Row label="Website" value={p.website} />}
            {p.about && <Row label="About" value={p.about} />}
            {p.products && <Row label="Products & services" value={p.products} />}
            {p.goals && <Row label="Looking for" value={p.goals} />}
          </section>

          <section className="card space-y-2.5 p-4">
            <h2 className="sec-label !mb-0">Verified business badge</h2>
            {p.status === "VERIFIED" ? (
              <p className="text-[13px] leading-relaxed text-ink-300">
                Your documents are verified — the badge shows on your card everywhere.
              </p>
            ) : (
              <p className="text-[13px] leading-relaxed text-ink-300">
                Document verification (GSTIN/PAN) opens soon. It&apos;s optional — your account is
                fully active without it, and verified businesses get a trust badge plus a ranking boost.
              </p>
            )}
          </section>

          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={startEdit}>
              Edit profile
            </button>
            <LogoutButton className="btn-ghost flex-1" />
          </div>
        </>
      ) : (
        form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Company name">
              <input required minLength={2} className="input" value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </Field>
            <Field label="Industry">
              <select required className="input" value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country">
                <input required minLength={2} className="input" value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </Field>
              <Field label="City">
                <input required minLength={2} className="input" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State (optional)">
                <input className="input" value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </Field>
              <Field label="Team size (optional)">
                <input className="input" placeholder="e.g. 11-50" value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })} />
              </Field>
            </div>
            <Field label="Website (optional)">
              <input className="input" placeholder="https://…" value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </Field>
            <Field label="About (optional)">
              <textarea rows={4} className="input resize-none" value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })} />
            </Field>
            <Field label="Products & services (optional)">
              <textarea rows={3} className="input resize-none" value={form.products}
                onChange={(e) => setForm({ ...form, products: e.target.value })} />
            </Field>
            <Field label="Looking for (optional)">
              <textarea rows={3} className="input resize-none" value={form.goals}
                onChange={(e) => setForm({ ...form, goals: e.target.value })} />
            </Field>
            <div className="flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button disabled={busy} className="btn-primary flex-1">
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="overline-label">{label}</p>
      <p className="mt-0.5 text-[14.5px] leading-relaxed whitespace-pre-wrap text-ink-100">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
