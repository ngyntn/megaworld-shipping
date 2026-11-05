import { Check } from "lucide-react";

export type StatTone = "blue" | "red" | "green";

/** Decorative right-hand art of a stat card (purely visual). */
export function StatDecor({ tone }: { tone: StatTone }) {
  if (tone === "blue")
    return (
      <svg className="stat-decor stat-decor-line" viewBox="0 0 140 70" aria-hidden>
        <defs>
          <linearGradient id="stat-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b6fd8" stopOpacity=".18" />
            <stop offset="100%" stopColor="#3b6fd8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M4 62 C24 64 30 34 54 36 S84 52 100 36 S120 12 132 8 L132 70 L4 70 Z" fill="url(#stat-line-fill)" />
        <path className="stat-line-path" d="M4 62 C24 64 30 34 54 36 S84 52 100 36 S120 12 132 8" pathLength="1" />
        <circle className="stat-line-dot" cx="132" cy="8" r="4.5" />
      </svg>
    );
  if (tone === "red")
    return (
      <span className="stat-decor stat-decor-bars" aria-hidden>
        {[34, 52, 72, 92].map((h, i) => (
          <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }} />
        ))}
      </span>
    );
  return (
    <span className="stat-decor stat-decor-check" aria-hidden>
      <span>
        <Check size={26} strokeWidth={2.6} />
      </span>
    </span>
  );
}
