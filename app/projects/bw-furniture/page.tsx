import { ClientWebsiteCaseStudy } from "@/components/ClientWebsiteCaseStudy";
import { createProjectMetadata } from "@/lib/metadata";

export const metadata = createProjectMetadata({
  title: "B&W Customized Furnitures — WordPress Client Website",
  description:
    "A portfolio-focused WordPress website for customized furniture, modular cabinetry, storage, and interior solutions in Cebu.",
  image: "/images/projects/bw.png",
  imageAlt: "B&W Customized Furnitures website",
});

export default function BwFurniturePage() {
  return (
    <ClientWebsiteCaseStudy
      number="04"
      title="B&W Furnitures"
      category="CUSTOM FURNITURE PORTFOLIO"
      introduction="A visual WordPress portfolio that helps customers explore custom furniture categories, evaluate craftsmanship, and start an inquiry."
      image="/images/projects/bw.png"
      imageAlt="B&W Customized Furnitures WordPress website home page"
      liveUrl="https://bwcustomizedfurniture.com/"
      currentHref="/projects/bw-furniture"
      story={{
        challenge: "Custom furniture is easier to understand when customers can see both the range of work and the details of finished spaces. A single gallery would make kitchens, cabinetry, storage, and living pieces hard to navigate.",
        decisions: "I separated the portfolio into recognizable furniture categories and used project galleries as the main proof. Service descriptions and a four-step process explain how an idea becomes a made-to-measure piece.",
        result: "Visitors can explore relevant work, understand the consultation-to-installation process, and start an inquiry with a clearer idea of what B&W can make for their space.",
      }}
      features={[
        "Category-led catalog for custom furniture and modular cabinetry",
        "Dedicated galleries for kitchens, storage, living, dining, and bedroom work",
        "Service descriptions focused on functionality, materials, and space planning",
        "Consultation, planning, crafting, and installation process presentation",
        "Portfolio gallery featuring completed client projects",
        "Contact and inquiry calls to action throughout the experience",
        "Facebook, Instagram, and TikTok integration",
        "Responsive navigation and image-focused layouts",
      ]}
      details={[
        { label: "CMS", value: "WordPress" },
        { label: "Information architecture", value: "Furniture categories, services, galleries, FAQs, and inquiries" },
        { label: "Visual content", value: "Large product and completed-project image collections" },
        { label: "Customer journey", value: "Discovery, consultation, design, crafting, and installation" },
        { label: "Content design", value: "Category descriptions, process messaging, and project presentation" },
        { label: "Interface", value: "Responsive, gallery-forward desktop and mobile layouts" },
      ]}
    />
  );
}
