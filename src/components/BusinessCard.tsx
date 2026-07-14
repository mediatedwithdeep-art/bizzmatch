import { VerifiedBadge } from "./Logo";

export type DiscoverProfile = {
  userId: string;
  companyName: string;
  ownerName: string;
  industry: string;
  country?: string;
  city: string;
  state: string | null;
  about: string | null;
  products: string | null;
  goals: string | null;
  website: string | null;
  verified?: boolean;
};

const HUES = [265, 190, 330, 250, 200]; // violet, cyan, magenta, indigo, sky
export const brandHue = (name: string) => HUES[(name.charCodeAt(0) + name.length) % 5];

export const brandGradient = (name: string) => {
  const h = brandHue(name);
  return `linear-gradient(135deg, hsl(${h} 62% 46%), hsl(${(h + 42) % 360} 66% 28%))`;
};

/** Monogram avatar with a deterministic gradient per company. */
export function Monogram({ name, size = "h-14 w-14 text-xl" }: { name: string; size?: string }) {
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-2xl font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]`}
      style={{ background: brandGradient(name) }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

/**
 * Premium profile card: gradient cover with monogram watermark and name
 * scrim (Tinder-style), then scrollable detail sections.
 */
export function BusinessCard({ profile }: { profile: DiscoverProfile }) {
  const h = brandHue(profile.companyName);
  const cover = `radial-gradient(300px 170px at 82% 8%, hsl(${(h + 42) % 360} 70% 38% / .95), transparent 70%),
    radial-gradient(360px 220px at 12% 88%, hsl(${h} 64% 30%), transparent 75%),
    linear-gradient(135deg, hsl(${h} 60% 40%), hsl(${(h + 42) % 360} 62% 22%))`;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-ink-800 to-ink-850 shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.07),inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="relative h-44 shrink-0 overflow-hidden" style={{ background: cover }}>
        <div
          aria-hidden
          className="pointer-events-none absolute -top-7 -right-2 text-[150px] font-black leading-none tracking-[-0.06em] text-white/10"
        >
          {profile.companyName.slice(0, 2).toUpperCase()}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950/85" />
        <div className="absolute right-4 bottom-3 left-4">
          <h2 className="display text-[25px] leading-tight [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">
            {profile.companyName}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-ink-200">
            <span>{profile.ownerName}</span>
            {profile.verified && <VerifiedBadge />}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-4.5 pt-3.5">
        <span className="chip">{profile.industry}</span>
        <span className="chip">
          📍 {[profile.city, profile.state ?? profile.country].filter(Boolean).join(", ")}
        </span>
      </div>

      <div className="mt-1 flex flex-col gap-3.5 overflow-y-auto px-4.5 pt-1 pb-5">
        {profile.about && (
          <section>
            <h3 className="sec-label">About</h3>
            <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-ink-200">{profile.about}</p>
          </section>
        )}
        {profile.products && (
          <section>
            <h3 className="sec-label">Products &amp; services</h3>
            <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-ink-200">{profile.products}</p>
          </section>
        )}
        {profile.goals && (
          <section>
            <h3 className="sec-label">Looking for</h3>
            <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-ink-200">{profile.goals}</p>
          </section>
        )}
        {!profile.about && !profile.products && !profile.goals && (
          <p className="text-[14px] leading-relaxed text-ink-400">
            {profile.companyName} hasn&apos;t added their story yet — say hello and ask!
          </p>
        )}
        {profile.website && (
          <p className="truncate text-sm text-ink-400">🔗 {profile.website}</p>
        )}
      </div>
    </div>
  );
}
