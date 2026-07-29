import type { Metadata } from "next";

type ProjectMetadataInput = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export function createProjectMetadata({
  title,
  description,
  image,
  imageAlt,
}: ProjectMetadataInput): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
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
