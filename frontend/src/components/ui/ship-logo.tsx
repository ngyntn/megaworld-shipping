export function ShipLogo({ waves = false, width = 46, height = 34 }: { waves?: boolean; width?: number; height?: number }) {
  return <svg width={width} height={height} viewBox="0 0 46 34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M4 22h38l-5 8H9zM10 22v-7h26v7M15 15V9h8v6M25 15v-4h7v4" />{waves && <path d="M2 32c3 0 3-1.5 6-1.5s3 1.5 6 1.5 3-1.5 6-1.5 3 1.5 6 1.5 3-1.5 6-1.5 3 1.5 6 1.5" />}</svg>;
}
