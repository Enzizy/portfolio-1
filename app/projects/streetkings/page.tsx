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
      overview={[
        "StreetKings PH needed a strong online presence for its auto painting, refinishing, protection, repair, and detailing services in Bacoor, Cavite.",
        "The website organizes a broad service catalog into clear categories while supporting customer decision-making with process explanations, completed work, before-and-after content, reviews, and frequently asked questions.",
        "Prominent calls to action connect visitors to consultation, booking, directions, phone contact, and Messenger without obscuring the visual impact of the brand’s automotive work.",
      ]}
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
