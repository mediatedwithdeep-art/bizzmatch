"use client";

import { useCallback, useEffect, useState } from "react";
import { api, timeAgo } from "@/lib/client";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { RowSkeletons } from "@/components/Skeletons";
import { toast } from "@/components/Toaster";

type Analytics = {
  totals: {
    users: number;
    activeProfiles: number;
    verifiedProfiles: number;
    connections: number;
    messages: number;
    swipes: number;
    openReports: number;
  };
  last7d: { signups: number; swipes: number; matches: number; messages: number };
  topIndustries: { industry: string; count: number }[];
};

type Application = {
  id: string;
  companyName: string;
  industry: string;
  city: string;
  country: string;
  gstin: string | null;
  pan: string | null;
  aadhaarLast4: string | null;
  createdAt: string;
  user: { email: string; name: string };
};

type Report = {
  id: string;
  reason: string;
  detail: string | null;
  createdAt: string;
  reporter: { email: string; company?: string | null };
  target: { userId: string; email: string; company?: string | null };
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  suspendedAt: string | null;
  createdAt: string;
  profile: { companyName: string; industry: string; country: string; city: string; status: string } | null;
};

const TABS = ["Overview", "Verifications", "Reports", "Users"] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  return (
    <main className="flex-1 px-5 py-5">
      <header className="mb-1 flex items-center justify-between">
        <Logo />
        <LogoutButton className="text-sm font-semibold text-ink-300 underline underline-offset-4" />
      </header>
      <h1 className="display mt-5 text-[21px]">Admin dashboard</h1>

      <div className="mt-4 mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`chip ${tab === t ? "chip-active" : ""}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <Overview />}
      {tab === "Verifications" && <Verifications />}
      {tab === "Reports" && <Reports />}
      {tab === "Users" && <Users />}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card flex-1 px-3 py-3.5 text-center">
      <div className="grad-text text-[22px] font-extrabold tabular-nums">{value.toLocaleString()}</div>
      <div className="mt-0.5 text-[10.5px] font-semibold text-ink-400">{label}</div>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState<Analytics | null>(null);
  useEffect(() => {
    api<Analytics>("/api/admin/analytics").then(setData).catch(() => {});
  }, []);
  if (!data) return <RowSkeletons count={3} />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2.5">
        <Stat label="Members" value={data.totals.users} />
        <Stat label="Connections" value={data.totals.connections} />
        <Stat label="Messages" value={data.totals.messages} />
      </div>
      <div className="flex gap-2.5">
        <Stat label="Swipes" value={data.totals.swipes} />
        <Stat label="Verified" value={data.totals.verifiedProfiles} />
        <Stat label="Open reports" value={data.totals.openReports} />
      </div>
      <section className="card p-4">
        <h2 className="sec-label">Last 7 days</h2>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13.5px] text-ink-200">
          <p>Signups: <b className="tabular-nums">{data.last7d.signups}</b></p>
          <p>Matches: <b className="tabular-nums">{data.last7d.matches}</b></p>
          <p>Swipes: <b className="tabular-nums">{data.last7d.swipes}</b></p>
          <p>Messages: <b className="tabular-nums">{data.last7d.messages}</b></p>
        </div>
      </section>
      <section className="card p-4">
        <h2 className="sec-label">Top industries</h2>
        <ul className="mt-2 space-y-1.5">
          {data.topIndustries.map((i) => (
            <li key={i.industry} className="flex justify-between text-[13.5px] text-ink-200">
              {i.industry} <b className="tabular-nums">{i.count}</b>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Verifications() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ applications: Application[] }>("/api/admin/verifications")
      .then((d) => setApps(d.applications))
      .catch(() => setApps([]));
  }, []);
  useEffect(load, [load]);

  async function decide(id: string, action: "APPROVE" | "REJECT") {
    let reason: string | undefined;
    if (action === "REJECT") {
      reason = window.prompt("Reason (shown to the applicant):") ?? undefined;
      if (reason === undefined) return;
    }
    setBusyId(id);
    try {
      await api(`/api/admin/verifications/${id}`, { method: "POST", body: { action, reason } });
      setApps((a) => a?.filter((x) => x.id !== id) ?? null);
      toast(action === "APPROVE" ? "Verified ✓" : "Rejected");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (apps === null) return <RowSkeletons count={3} />;
  if (apps.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-ink-400">
        No pending verifications. (Document verification is currently{" "}
        <span className="text-ink-200">optional</span> — submissions appear here when enabled.)
      </p>
    );
  }

  return (
    <ul className="space-y-3 pb-6">
      {apps.map((a) => (
        <li key={a.id} className="card space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[15px] font-bold">{a.companyName}</p>
              <p className="text-[13px] text-ink-300">{a.user.name} · {a.user.email}</p>
            </div>
            <span className="shrink-0 text-[10.5px] text-ink-400">{timeAgo(a.createdAt)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">{a.industry}</span>
            <span className="chip">{a.city}, {a.country}</span>
          </div>
          <dl className="grid grid-cols-3 gap-2 rounded-xl bg-ink-900 p-3 text-center shadow-[0_0_0_1px_var(--color-ink-700)]">
            <Doc label="GSTIN" value={a.gstin ?? "—"} />
            <Doc label="PAN" value={a.pan ?? "—"} />
            <Doc label="Aadhaar" value={a.aadhaarLast4 ? `••${a.aadhaarLast4}` : "—"} />
          </dl>
          <div className="flex gap-2.5">
            <button disabled={busyId === a.id} onClick={() => decide(a.id, "REJECT")} className="btn-danger flex-1 !py-2.5 !text-sm">
              Reject
            </button>
            <button disabled={busyId === a.id} onClick={() => decide(a.id, "APPROVE")} className="btn-primary flex-1 !py-2.5 !text-sm">
              Approve
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Reports() {
  const [reports, setReports] = useState<Report[] | null>(null);

  const load = useCallback(() => {
    api<{ reports: Report[] }>("/api/admin/reports")
      .then((d) => setReports(d.reports))
      .catch(() => setReports([]));
  }, []);
  useEffect(load, [load]);

  async function resolve(id: string, status: "RESOLVED" | "DISMISSED") {
    try {
      await api(`/api/admin/reports/${id}`, { method: "PATCH", body: { status } });
      setReports((r) => r?.filter((x) => x.id !== id) ?? null);
      toast(status === "RESOLVED" ? "Report resolved" : "Report dismissed");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  if (reports === null) return <RowSkeletons count={3} />;
  if (reports.length === 0) {
    return <p className="py-12 text-center text-sm text-ink-400">No open reports. 🎉</p>;
  }

  return (
    <ul className="space-y-3 pb-6">
      {reports.map((r) => (
        <li key={r.id} className="card space-y-2.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[14px] font-bold">
              {r.reason.replace(/_/g, " ")} — {r.target.company ?? r.target.email}
            </p>
            <span className="shrink-0 text-[10.5px] text-ink-400">{timeAgo(r.createdAt)}</span>
          </div>
          {r.detail && <p className="text-[13px] leading-relaxed text-ink-300">{r.detail}</p>}
          <p className="text-[12px] text-ink-400">Reported by {r.reporter.company ?? r.reporter.email}</p>
          <div className="flex gap-2.5">
            <button onClick={() => resolve(r.id, "DISMISSED")} className="btn-ghost flex-1 !py-2 !text-sm">
              Dismiss
            </button>
            <button onClick={() => resolve(r.id, "RESOLVED")} className="btn-primary flex-1 !py-2 !text-sm">
              Resolve
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Users() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback((query: string) => {
    api<{ users: AdminUser[] }>(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((d) => setUsers(d.users))
      .catch(() => setUsers([]));
  }, []);
  useEffect(() => load(""), [load]);

  async function toggleSuspend(u: AdminUser) {
    try {
      await api(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        body: { suspended: !u.suspendedAt },
      });
      toast(u.suspendedAt ? "Account restored" : "Account suspended");
      load(q);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  return (
    <div className="space-y-3 pb-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
        className="flex gap-2"
      >
        <input className="input flex-1" placeholder="Search email, name, company…" value={q}
          onChange={(e) => setQ(e.target.value)} />
        <button className="btn-ghost !px-4">Search</button>
      </form>

      {users === null ? (
        <RowSkeletons count={4} />
      ) : (
        users.map((u) => (
          <div key={u.id} className="card flex items-center gap-3 p-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold">
                {u.profile?.companyName ?? u.name}
                {u.role !== "USER" && (
                  <span className="chip ml-2 !px-2 !py-0 !text-[9.5px]">{u.role}</span>
                )}
                {u.suspendedAt && (
                  <span className="ml-2 text-[10px] font-bold text-rose-500">SUSPENDED</span>
                )}
              </p>
              <p className="truncate text-[12px] text-ink-400">
                {u.email} · {u.profile ? `${u.profile.city}, ${u.profile.country}` : "no profile"} ·{" "}
                {timeAgo(u.createdAt)}
              </p>
            </div>
            {u.role === "USER" && (
              <button
                onClick={() => toggleSuspend(u)}
                className={`shrink-0 !py-1.5 !px-3 !text-[12px] ${u.suspendedAt ? "btn-ghost" : "btn-danger"}`}
              >
                {u.suspendedAt ? "Restore" : "Suspend"}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function Doc({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="overline-label !text-[9px]">{label}</dt>
      <dd className="mt-1 font-mono text-[11px] break-all text-ink-200">{value}</dd>
    </div>
  );
}
