/** Cute sleeping face that breathes, with "z z Z" floating up — used on the hibernate screen. */
export function SleepingIcon() {
  return (
    <span className="sleeping-icon" aria-hidden>
      <svg className="sleeping-face" viewBox="0 0 64 64" width="64" height="64">
        <circle cx="32" cy="34" r="22" className="sleeping-head" />
        {/* closed eyes */}
        <path d="M20 32 q5 5 10 0" className="sleeping-line" />
        <path d="M34 32 q5 5 10 0" className="sleeping-line" />
        {/* blush */}
        <ellipse cx="20" cy="40" rx="3.6" ry="2.2" className="sleeping-blush" />
        <ellipse cx="44" cy="40" rx="3.6" ry="2.2" className="sleeping-blush" />
        {/* snoring mouth */}
        <ellipse cx="32" cy="45" rx="3" ry="3" className="sleeping-mouth" />
      </svg>
      <span className="sleeping-z z1">z</span>
      <span className="sleeping-z z2">z</span>
      <span className="sleeping-z z3">Z</span>
    </span>
  );
}
