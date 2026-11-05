import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  experimental: { staleTimes: { dynamic: 30 }, serverActions: { bodySizeLimit: "3mb" } },
};
export default config;
