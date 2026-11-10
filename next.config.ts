import type { NextConfig } from "next"

const r2AccountId = process.env.R2_ACCOUNT_ID

const nextConfig: NextConfig = {
  images: r2AccountId
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: `${r2AccountId}.r2.cloudflarestorage.com`,
            pathname: "/**",
          },
        ],
      }
    : undefined,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
}

export default nextConfig
