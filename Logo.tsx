import Image from "next/image";

/**
 * BizMatch brand mark. Uses /public/logo-mark.svg by default.
 * To use your exact logo instead, drop your file in the public/ folder as
 * "logo-mark.svg" (or logo-mark.png and change the src below to .png).
 */
export function Gem({ size = 26 }: { size?: number }) {
  return (
    <Image
      src="/logo-mark.svg"
      alt=""
      width={size}
      height={size}
      priority
      unoptimized
      className="shrink-0"
      style={{ width: size, height: size }}
    />
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
