import { ClientWebsiteCaseStudy } from "@/components/ClientWebsiteCaseStudy";
import { createProjectMetadata } from "@/lib/metadata";

export const metadata = createProjectMetadata({
  title: "StreetKings PH — WordPress Client Website",
  description:
    "A responsive WordPress website for a Bacoor-based auto painting, refinishing, protection, and detailing business.",
  image: "/images/projects/street.png",
  imageAlt: "StreetKings PH automotive website",
});

export default function StreetKingsPage() {
  return (
    <ClientWebsiteCaseStudy
      number="03"
      title="StreetKings PH"
      category="AUTOMOTIVE SERVICE WEBSITE"
      introduction="A service-led WordPress website that presents StreetKings’ automotive expertise and gives customers direct paths to inquire, book, or visit the shop."
      image="/images/projects/street.png"
      imageAlt="StreetKings PH automotive painting and detailing website home page"
      liveUrl="https://streetkingsph.com/"
      currentHref="/projects/streetkings"
      story={{
        challenge: "StreetKings offers several automotive services, but a visitor needs to know quickly which one fits their car and whether the shop can deliver the finish they want.",
        decisions: "I organized the service catalog around customer needs, then paired each path with completed work, process explanations, reviews, and answers to common questions. Consultation, booking, directions, phone, and Messenger remain close to the relevant content.",
        result: "The WordPress site gives customers a clear way to compare services, inspect the shop's work, and choose how to contact or visit StreetKings.",
      }}
      features={[
        "Structured paint protection, detailing, painting, and refinishing service pages",
        "Service-focused landing page with strong automotive brand presentation",
        "Consultation, inspection, execution, and release process explanation",
        "Completed-work photo gallery and before-and-after showcase",
        "Customer reviews and frequently asked questions",
        "Direct booking, phone, Messenger, and consultation paths",
        "Google Maps directions and visible shop information",
        "Responsive navigation and content presentation",
      ]}
      details={[
        { label: "CMS", value: "WordPress" },
        { label: "Information architecture", value: "Service categories, detail pages, FAQs, and contact paths" },
        { label: "Visual content", value: "Automotive galleries, completed work, and before-and-after media" },
        { label: "Lead generation", value: "Booking, consultation, Messenger, phone, and directions" },
        { label: "Content design", value: "Business positioning, benefits, process, and trust signals" },
        { label: "Interface", value: "Responsive desktop and mobile presentation" },
      ]}
    />
  );
}
