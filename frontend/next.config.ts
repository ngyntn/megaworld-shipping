import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  outputFileTracingIncludes: { "/admin/*/export": ["./assets/excel/*.xlsx"] },
  experimental: { staleTimes: { dynamic: 30 }, serverActions: { bodySizeLimit: "3mb" } },
};
export default config;
