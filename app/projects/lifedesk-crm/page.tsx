import { PrivateProjectCaseStudy, type PrivateProjectDetails } from "@/components/PrivateProjectCaseStudy";
import { createProjectMetadata } from "@/lib/metadata";

const project: PrivateProjectDetails = {
  number: "08",
  title: "LifeDesk CRM",
  category: "AI-ASSISTED PROSPECTING",
  introduction: "A personal CRM that turns local business discovery into a reviewed prospect list and organized outreach workflow.",
  role: "Full-stack product development",
  platform: "Private web application",
  coreStack: "React · Supabase · AI workflows",
  image: "/images/projects/lifedesk-crm.png",
  imageAlt: "LifeDesk CRM empty-state home page with example searches and no prospect records",
  imageNote: "Current app screenshot from its empty-state development preview. No prospect or contact records are shown.",
  imageFit: "cover",
  story: {
    challenge: "Finding businesses in a target area meant repeating searches, copying contact details, and deciding from scattered clues which companies were worth approaching. I wanted a prospect list I could trust before making a call or sending an email.",
    decisions: "I made natural-language search editable, then separated discovered candidates from approved prospects. Duplicate checks, source evidence, and confidence stay visible; AI can help qualify a lead and draft outreach, but I review each step before using it.",
    result: "LifeDesk CRM turns area-based discovery into an organized pipeline of reviewed prospects, contact context, and draft outreach. Calls and emails remain deliberate actions I take myself.",
  },
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
    { label: "AI", value: "AI assistance through secure server functions, with human approval in the workflow" },
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
