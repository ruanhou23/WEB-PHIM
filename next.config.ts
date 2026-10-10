import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.ophim.live",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ophim17.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.ophim.live",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "phimimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.phimimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/**",
      },
    ],
  },
  devIndicators: false,
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
