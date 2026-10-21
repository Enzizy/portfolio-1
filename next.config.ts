import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Roarly was renamed CasaToon; keep old links and search results working.
  async redirects() {
    return [{ source: "/projects/roarly", destination: "/projects/casatoon", permanent: true }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" }],
  },
};

export default nextConfig;
