import type { Metadata } from "next";

type ProjectMetadataInput = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  /** The page's own path, e.g. "/projects/casatoon". Without it the page inherits the home canonical. */
  path: string;
};

export function createProjectMetadata({
  title,
  description,
  image,
  imageAlt,
  path,
}: ProjectMetadataInput): Metadata {
  return {
    // The name in the tab title helps the project pages rank for searches of it.
    title: `${title} | Zhyronne Batican`,
    description,
    alternates: { canonical: path },
    openGraph: {
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
