import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  turbopack: {
    root: process.cwd()
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com"
      }
    ]
  },
  async redirects() {
    return [
      { source: "/indices", destination: "/market/", permanent: true },
      { source: "/indices/:slug*", destination: "/market/", permanent: true }
    ];
  }
};

export default nextConfig;
