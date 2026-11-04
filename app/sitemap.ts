import type { MetadataRoute } from "next";
import { projects } from "@/data/portfolio";
import { siteUrl } from "@/lib/site";

// Bump when page content changes. It is a fixed date because the site rebuilds daily, and a
// "last modified" that moves without real changes teaches search engines to ignore it.
const lastModified = "2026-11-04";

// V2-V4 are alternate designs of the home page and canonicalize to it, so they stay out of here.
export default function sitemap(): MetadataRoute.Sitemap {
  return [siteUrl, `${siteUrl}/projects`, ...projects.map((project) => `${siteUrl}${project.href}`), `${siteUrl}/arcade`]
    .map((url) => ({ url, lastModified }));
}
