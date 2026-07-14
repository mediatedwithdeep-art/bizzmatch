/** 3D spinning gem — the BizMatch brand mark. CSS-only cube, no assets. */
export function Gem({ size = 22 }: { size?: number }) {
  const s2 = size / 2;
  return (
    <div className="gem-scene" style={{ width: size, height: size, ["--s2" as string]: `${s2}px` }} aria-hidden>
      <div className="gem">
        <div className="gem-face f-front" />
        <div className="gem-face f-back" />
        <div className="gem-face f-right" />
        <div className="gem-face f-left" />
        <div className="gem-face f-top" />
        <div className="gem-face f-bottom" />
      </div>
    </div>
  );
}

export function Logo({
  size = "text-2xl",
  gemSize = 26,
  gem = true,
}: {
  size?: string;
  gemSize?: number;
  gem?: boolean;
}) {
  return (
    <span className={`display inline-flex items-center gap-2 ${size}`}>
      {gem && <Gem size={gemSize} />}
      <span>
        <span className="text-ink-100">Biz</span>
        <span className="grad-text">Match</span>
      </span>
    </span>
  );
}

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`vbadge ${className}`} title="Verified business">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.4 3.9a1 1 0 0 1 .2 1.4l-7 9a1 1 0 0 1-1.5.1l-4-4a1 1 0 1 1 1.4-1.4l3.2 3.2 6.3-8.1a1 1 0 0 1 1.4-.2Z"
          clipRule="evenodd"
        />
      </svg>
      VERIFIED
    </span>
  );
}
