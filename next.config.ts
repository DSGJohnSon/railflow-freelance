import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions cap request bodies at 1MB by default, which most quote
    // and invoice PDFs exceed.
    serverActions: { bodySizeLimit: "10mb" },
  },
}

export default nextConfig
