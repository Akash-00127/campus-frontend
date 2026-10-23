import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Keep Turbopack scoped to this app instead of walking up to the Desktop lockfile.
    root: process.cwd(),
  },
  experimental: {
    serverActions: { bodySizeLimit: "7mb" },
  },
};
export default nextConfig;
