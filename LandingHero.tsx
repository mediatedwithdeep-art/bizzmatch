"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Gem, Logo } from "./Logo";

const ease = [0.22, 1, 0.36, 1] as const;
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease },
});
const INTRO_SEEN_KEY = "bizmatch-intro-seen";

/** Cinematic once-per-session intro: gem spin-in, letter-by-letter wordmark, tagline, progress bar. */
function CinematicIntro({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const word = "BizMatch";

  useEffect(() => {
    if (reduced) {
      onDone();
      return;
    }
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [reduced, onDone]);

  if (reduced) return null;

  return (
    <motion.div
      role="presentation"
      onClick={onDone}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.7, ease }}
      className="fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center gap-6"
      style={{ background: "radial-gradient(900px 600px at 50% 40%, rgba(139,92,246,.18), transparent 60%), #050409" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.2, rotate: -40 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.4, ease }}
        style={{ width: 110, height: 110 }}
      >
        <Gem size={110} />
      </motion.div>
      <div className="display flex text-[44px]">
        {word.split("").map((c, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 26, rotateX: 70 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.6, delay: 0.55 + i * 0.07, ease }}
            className={i >= 3 ? "grad-text" : "text-ink-100"}
          >
            {c}
          </motion.span>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.35, ease }}
        className="text-[12px] font-bold tracking-[0.28em] text-ink-400 uppercase"
      >
        Swipe · Match · Do business
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="h-[3px] w-[150px] overflow-hidden rounded-full bg-white/8"
      >
        <motion.i
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, delay: 1.55, ease }}
          className="block h-full w-full origin-left rounded-full"
          style={{ background: "linear-gradient(90deg, var(--color-gold-500), var(--color-gold-600))" }}
        />
      </motion.div>
    </motion.div>
  );
}

/** Count-up stat that animates when scrolled into view. */
function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) { setN(value); return; }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min((t - t0) / 1200, 1);
          setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, reduced]);

  return (
    <div ref={ref} className="glass flex-1 px-3 py-4 text-center">
      <div className="display grad-text text-[26px] tabular-nums">
        {n.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-[11px] font-semibold tracking-wide text-ink-300">{label}</div>
    </div>
  );
}

const STEPS = [
  { icon: "⚡", title: "Sign up in a minute", text: "Name, email, company, industry and location — you're in immediately. No waiting, no documents." },
  { icon: "🤝", title: "Swipe to connect", text: "Discover businesses by industry and city. Interested? One swipe says it." },
  { icon: "💬", title: "Match & do business", text: "Mutual interest unlocks a private chat. No cold outreach, no spam." },
];

const TESTIMONIALS = [
  { quote: "Found two distributors for our fastener line in the first week. I was swiping the same day I signed up.", name: "Arjun Mehta", company: "SteelLine Industries, Ludhiana" },
  { quote: "We matched with a hotel chain and signed a weekly supply contract within days. It genuinely feels like Tinder for business.", name: "Rahul Verma", company: "FreshFarm Organics, Nashik" },
  { quote: "As an agency, lead quality is everything. Matches here already want to talk — the mutual-interest model just works.", name: "Meera Kapoor", company: "BrandBoost Media, Mumbai" },
];

export function LandingHero() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(INTRO_SEEN_KEY)) setShowIntro(true);
    } catch {
      /* sessionStorage unavailable — skip intro */
    }
  }, []);

  function dismissIntro() {
    setShowIntro(false);
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="relative flex-1 overflow-x-clip px-6 pb-12">
      <AnimatePresence>{showIntro && <CinematicIntro onDone={dismissIntro} />}</AnimatePresence>

      {/* aurora orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="float-slow absolute -top-16 right-[-70px] h-56 w-56 rounded-full bg-gold-500/18 blur-3xl" />
        <div className="float-slower absolute top-[34rem] left-[-80px] h-64 w-64 rounded-full bg-gold-600/12 blur-3xl" />
        <div className="float-slow absolute top-[70rem] right-[-60px] h-52 w-52 rounded-full bg-magenta-500/10 blur-3xl" />
      </div>

      <motion.header {...rise(0)} className="flex items-center justify-between pt-8">
        <Logo size="text-[26px]" gemSize={30} />
        <Link href="/login" className="btn-ghost !px-4 !py-2 !text-[13.5px]">
          Sign in
        </Link>
      </motion.header>

      {/* hero */}
      <motion.h1 {...rise(0.08)} className="display mt-14 text-[42px] leading-[1.06]">
        Swipe. Match.
        <br />
        <span className="grad-text">Do business.</span>
      </motion.h1>

      <motion.p {...rise(0.16)} className="mt-5 max-w-[34ch] text-[16.5px] leading-relaxed text-ink-300">
        A private network of <span className="font-semibold text-ink-100">real business owners</span>,
        rendered in full depth. Build your profile, swipe your way in, and unlock chat the moment you match.
      </motion.p>

      <motion.div {...rise(0.24)} className="mt-8 space-y-3">
        <Link href="/signup" className="btn-primary w-full !py-3.5 !text-base">
          Create business account
        </Link>
        <p className="text-center text-[11.5px] text-ink-400">
          Free to join · Live in under a minute
        </p>
      </motion.div>

      {/* floating 3D card stack */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.4, ease }}
        className="relative mx-auto mt-14 h-[220px] w-full max-w-[280px]"
        style={{ perspective: 1400 }}
      >
        <div className="glass absolute inset-0 rounded-[22px]" style={{
          transformStyle: "preserve-3d",
          transform: "translate3d(-26px,18px,-70px) rotateY(10deg) rotate(-7deg)",
          opacity: 0.55,
          background: "linear-gradient(135deg, rgba(139,92,246,.25), rgba(76,29,149,.4))",
          animation: "float-slow 8s ease-in-out infinite",
        }} />
        <div className="glass absolute inset-0 rounded-[22px]" style={{
          transformStyle: "preserve-3d",
          transform: "translate3d(20px,8px,-30px) rotateY(-8deg) rotate(5deg)",
          opacity: 0.8,
          background: "linear-gradient(135deg, rgba(34,211,238,.2), rgba(8,145,178,.35))",
          animation: "float-slow 7s ease-in-out .5s infinite",
        }} />
        <div className="absolute inset-0 overflow-hidden rounded-[22px]" style={{
          transformStyle: "preserve-3d",
          animation: "float-slow 6.5s ease-in-out 1s infinite",
        }}>
          <div
            className="relative h-24"
            style={{
              background:
                "radial-gradient(220px 130px at 80% 10%, hsl(266 70% 45% / .95), transparent 70%), linear-gradient(135deg, hsl(266 60% 42%), hsl(190 65% 30%))",
            }}
          >
            <div className="absolute -top-4 -right-1 text-[90px] font-black leading-none text-white/10">NC</div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-950/85" />
            <div className="absolute bottom-2.5 left-4">
              <div className="display text-base">Nimbus Cloud Works</div>
              <div className="text-[11px] text-ink-200">
                Sneha Iyer · <span className="font-bold text-teal-500">✓ Verified</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 bg-gradient-to-b from-ink-800 to-ink-850 p-3.5">
            <div className="flex gap-1.5">
              <span className="chip !text-[10px]">IT &amp; Software</span>
              <span className="chip !text-[10px]">📍 Bengaluru</span>
            </div>
            <p className="text-[12px] leading-relaxed text-ink-300">
              SaaS studio shipping product for 60+ SME clients across India.
            </p>
          </div>
        </div>
      </motion.div>

      {/* stats */}
      <div className="mt-16 flex gap-3">
        <Stat value={2400} suffix="+" label="Active businesses" />
        <Stat value={17} suffix="" label="Industries" />
        <Stat value={9200} suffix="+" label="Connections made" />
      </div>

      {/* how it works */}
      <section className="mt-16">
        <p className="overline-label">How it works</p>
        <h2 className="display mt-2 text-[26px]">Three steps to your next deal</h2>
        <div className="mt-6 space-y-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease }}
              className="card flex items-start gap-4 p-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-500/14 text-xl shadow-[0_0_0_1px_rgba(139,92,246,0.35)]">
                {s.icon}
              </div>
              <div>
                <h3 className="text-[15px] font-bold">{s.title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-300">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* trust */}
      <section className="mt-16">
        <p className="overline-label">Trust &amp; security</p>
        <h2 className="display mt-2 text-[26px]">Built for real business</h2>
        <div className="glass mt-6 space-y-4 p-5">
          {[
            ["⚡", "No gatekeeping", "Sign up and start swiping the same minute — no waiting on manual review."],
            ["🛡️", "Optional business verification", "Add GSTIN/PAN documents anytime to earn the Verified Business badge and a ranking boost."],
            ["🚫", "Block, report, moderated", "Instantly block anyone, and our team reviews every report."],
          ].map(([icon, title, text]) => (
            <div key={title as string} className="flex items-start gap-3.5">
              <span className="text-lg">{icon}</span>
              <div>
                <div className="text-[14px] font-bold">{title}</div>
                <div className="mt-0.5 text-[12.5px] leading-relaxed text-ink-300">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* testimonials */}
      <section className="mt-16">
        <p className="overline-label">From the network</p>
        <h2 className="display mt-2 text-[26px]">Owners are matching</h2>
        <div className="mt-6 space-y-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease }}
              className="card p-5"
            >
              <div aria-hidden className="grad-text text-2xl leading-none">“</div>
              <blockquote className="mt-1 text-[14px] leading-relaxed text-ink-200">{t.quote}</blockquote>
              <figcaption className="mt-3 text-[12px] text-ink-400">
                <span className="font-bold text-ink-200">{t.name}</span> · {t.company}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease }}
        className="glow-gold glass mt-16 p-7 text-center"
      >
        <h2 className="display text-[26px]">
          Your next partner is <span className="grad-text">one swipe away</span>
        </h2>
        <p className="mx-auto mt-2 max-w-[30ch] text-[13.5px] leading-relaxed text-ink-300">
          Join thousands of business owners growing their network.
        </p>
        <Link href="/signup" className="btn-primary mt-5 w-full">
          Create your account
        </Link>
        <Link href="/login" className="mt-3 block text-[13px] font-semibold text-gold-400">
          I already have an account →
        </Link>
      </motion.section>

      <footer className="mt-12 text-center text-[11px] text-ink-400">
        © {new Date().getFullYear()} BizMatch · Verified B2B networking
      </footer>
    </main>
  );
}
