import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Roarly was renamed CasaToon; keep old links and search results working.
  async redirects() {
    return [
      { source: "/projects/roarly", destination: "/projects/casatoon", permanent: true },
      // The site moved from Vercel to Cloudflare: send old links and search results to the new address.
      {
        source: "/:path*",
        has: [{ type: "host", value: "zhyronne-batican.vercel.app" }],
        destination: "https://portfolio.zhyronnebatican.workers.dev/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" }],
  },
};

export default nextConfig;

// Gives `next dev` the same Cloudflare bindings the deployed worker has.
import("@opennextjs/cloudflare").then((module) => module.initOpenNextCloudflareForDev());
