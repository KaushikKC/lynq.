import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration for Next.js 16+
  turbopack: {},
  typescript: {
    ignoreBuildErrors: false,
  },
  // Transpile packages that need it
  transpilePackages: ["@privy-io/react-auth", "@privy-io/wagmi"],
  experimental: {
    // Optimize package imports to avoid bundling server-only code
    optimizePackageImports: [
      "@privy-io/react-auth",
      "@privy-io/wagmi",
      "@walletconnect/ethereum-provider",
    ],
  },
};

export default nextConfig;
