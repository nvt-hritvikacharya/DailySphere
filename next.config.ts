import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Article images come from arbitrary publisher hosts; serving them directly avoids running
  // an open image proxy through /_next/image.
  images: { unoptimized: true },
  poweredByHeader: false,
  webpack: (config) => {
    // cursor/identity.ts uses ESM-style ".js" specifiers for its TypeScript siblings.
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};

export default nextConfig;
