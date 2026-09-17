import { PrivateProjectCaseStudy, type PrivateProjectDetails } from "@/components/PrivateProjectCaseStudy";
import { createProjectMetadata } from "@/lib/metadata";

const project: PrivateProjectDetails = {
  number: "08",
  title: "LifeDesk CRM",
  category: "AI-ASSISTED PROSPECTING",
  introduction: "A personal CRM that turns local business discovery into a reviewed prospect list and organized outreach workflow.",
  role: "Full-stack product development",
  platform: "Private web application",
  coreStack: "React · Supabase · Gemini",
  image: "/images/projects/lifedesk-crm.png",
  imageAlt: "LifeDesk CRM empty-state home page with example searches and no prospect records",
  imageNote: "Current app screenshot from its empty-state development preview. No prospect or contact records are shown.",
  imageFit: "cover",
  overview: [
    "LifeDesk CRM helps me find businesses in a chosen area, assess whether they fit my services, and prepare useful context for a personal sales conversation.",
    "A natural-language search becomes editable location and business filters. Candidate businesses are reviewed for duplicates, supporting evidence, and confidence before they become prospects.",
    "AI-assisted qualification and personalized email drafts support the process. I review the output and send any outreach myself; the app does not send emails or place calls automatically.",
  ],
  features: [
    "Turn a plain-language search into editable discovery filters",
    "Discover area-based business candidates with Geoapify",
    "Review duplicates, evidence, and confidence before saving",
    "Approve leads before AI qualification and Places enrichment",
    "Draft personalized outreach for manual review and sending",
    "Track prospects, clients, tasks, and calendar activity",
  ],
  architecture: [
    { label: "Interface", value: "React 19, TypeScript, and Vite" },
    { label: "Data", value: "Supabase Postgres with row-level security" },
    { label: "Discovery", value: "Geoapify candidate search and Google Places enrichment" },
    { label: "AI", value: "Gemini through Supabase Edge Functions, with human approval in the workflow" },
  ],
  href: "/projects/lifedesk-crm",
};

export const metadata = createProjectMetadata({
  title: "LifeDesk CRM — AI-Assisted Prospecting",
  description: "A personal CRM for local business discovery, reviewed lead qualification, outreach drafting, and pipeline management.",
  image: project.image,
  imageAlt: project.imageAlt,
});

export default function LifeDeskCRMPage() {
  return <PrivateProjectCaseStudy project={project} />;
}
