import type { MetadataRoute } from "next";
import { projects } from "@/data/portfolio";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://portfolio-1-enzizy.vercel.app")
  .replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}${project.href}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...projectPages,
  ];
}
