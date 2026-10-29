import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Roarly was renamed CasaToon; keep old links and search results working.
  async redirects() {
    return [
      { source: "/projects/roarly", destination: "/projects/casatoon", permanent: true },
      // StreetKings was removed when the client's site went offline.
      { source: "/projects/streetkings", destination: "/projects", permanent: true },
      // Screen Room (/movies) was removed; old links and crawlers land on the home page.
      { source: "/movies/:path*", destination: "/", permanent: true },
      // Earlier addresses of the site: send old links and search results to the current one.
      {
        source: "/:path*",
        has: [{ type: "host", value: "zhyronne-batican.vercel.app" }],
        destination: "https://zhyronne.workwithoddly.com/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    // Images are already sized WebP files; serving them as-is avoids per-image resize costs.
    unoptimized: true,
  },
};

export default nextConfig;

// Gives `next dev` the same Cloudflare bindings the deployed worker has.
import("@opennextjs/cloudflare").then((module) => module.initOpenNextCloudflareForDev());
