import type { Metadata } from "next";

export const defaultTitle = "Zhyronne Batican — Full Stack Developer & AI Engineer, Philippines";
export const defaultDescription =
  "Zhyronne Batican is a freelance full-stack developer and AI engineer in the Philippines building web apps, WordPress sites, mobile apps, and AI tools.";

const defaultShareImage = { url: "/opengraph-image", width: 1200, height: 630, alt: "Zhyronne Batican portfolio" };
const siteOpenGraph = { siteName: "Zhyronne Batican", locale: "en_US" };

type PageMetadataInput = {
  title: string;
  description: string;
  /** The page's own path. Without it the page inherits the home canonical. */
  path: string;
};

/** Canonical plus matching share cards, for pages that use the default share image. */
export function createPageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...siteOpenGraph, title, description, type: "website", url: path, images: [defaultShareImage] },
    twitter: { card: "summary_large_image", title, description, images: [defaultShareImage.url] },
  };
}

type ProjectMetadataInput = {
  title: string;
  description: string;
  imageAlt: string;
  /** The page's own path, e.g. "/projects/casatoon". Its share image is /images/og/casatoon.jpg. */
  path: string;
};

export function shareImageFor(path: string) {
  return `/images/og/${path.split("/").at(-1)}.jpg`;
}

export function createProjectMetadata({
  title,
  description,
  imageAlt,
  path,
}: ProjectMetadataInput): Metadata {
  const image = shareImageFor(path);
  return {
    // The name in the tab title helps the project pages rank for searches of it.
    title: `${title} | Zhyronne Batican`,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...siteOpenGraph,
      title,
      description,
      type: "article",
      url: path,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
