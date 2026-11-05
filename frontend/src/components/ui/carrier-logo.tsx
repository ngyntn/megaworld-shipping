import { CarrierBadge } from "./carrier-badge";

type Props = {
  code: string;
  name?: string;
  /** Logo uploaded on the "Hãng tàu & cảng" page — the single source of truth. */
  logoUrl?: string;
  /** sm 48×28 (tables) · md 52×30 (panels, default) · lg 64×30 (catalog list). Styles live in admin.css (global). */
  size?: "sm" | "md" | "lg";
};

/** Carrier logo used everywhere; falls back to a text badge only when no logo is uploaded. */
export function CarrierLogo({ code, name, logoUrl, size = "md" }: Props) {
  if (!logoUrl) return <CarrierBadge code={code} />;
  // eslint-disable-next-line @next/next/no-img-element -- PocketBase file URL, sized by CSS
  return <img className={`carrier-logo carrier-logo-${size}`} src={logoUrl} alt={name || code} decoding="async" />;
}
