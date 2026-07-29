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
      overview={[
        "B&W Customized Furnitures needed a website capable of presenting a wide range of made-to-measure furniture and modular interior work without losing clarity.",
        "The experience separates kitchens, closets, TV consoles, wardrobes, dining sets, sala sets, storage beds, loft beds, and ottomans into understandable service categories supported by extensive project galleries.",
        "Brand messaging, a collaborative four-step process, social channels, and inquiry paths help turn visual inspiration into a practical customer conversation.",
      ]}
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
