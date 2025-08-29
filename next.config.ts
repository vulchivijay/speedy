import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    IPINFO_TOKEN: process.env.IPINFO_TOKEN,
  }
};

export default nextConfig;
