import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No external image domains needed - using local images from /public folder
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
