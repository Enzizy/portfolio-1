import { PrivateProjectCaseStudy, type PrivateProjectDetails } from "@/components/PrivateProjectCaseStudy";
import { createProjectMetadata } from "@/lib/metadata";

const project: PrivateProjectDetails = {
  number: "07",
  title: "CCR",
  category: "INTERNAL BUSINESS OPERATIONS",
  introduction: "A private operations workspace that tracks an order from purchase order through delivery, billing, and payment.",
  role: "Full-stack product development",
  platform: "Private web application",
  coreStack: "Vue 3 · Supabase · AI assistant",
  image: "/images/projects/ccr.svg",
  imageAlt: "Illustration of CCR's order, delivery, billing, and payment workflow; no business records are shown",
  imageNote: "Illustrative workflow, not a screenshot. Business records are private.",
  overview: [
    "CCR brings daily business operations into one connected workflow so an order can be followed through fulfillment and collection.",
    "It links purchase orders to partial deliveries and delivery receipts, then to statements of account and payments. The system also covers expenses, trips, payroll advances, delivery issues, and financial summaries.",
    "An internal AI assistant helps answer workflow and audit questions. It provides guidance but cannot create or change business records.",
  ],
  features: [
    "Track purchase orders and partial deliveries",
    "Create delivery receipts and statements of account",
    "Record payments and monitor outstanding balances",
    "Review expenses, trips, and payroll advances",
    "Track delivery issues and replacements",
    "Use a guidance-only assistant for operational audits",
  ],
  architecture: [
    { label: "Interface", value: "Vue 3 Composition API, Vite, Tailwind CSS, Pinia, and Vue Router" },
    { label: "Data", value: "Supabase with row-level access controls and an Express/SQLite local fallback" },
    { label: "Access", value: "Authenticated internal roles protect business workflows and records" },
    { label: "Assistant", value: "Read-only operational guidance without write access to records" },
  ],
  href: "/projects/ccr",
};

export const metadata = createProjectMetadata({
  title: "CCR — Internal Business Operations",
  description: "A private operations system connecting purchase orders, deliveries, billing, payments, expenses, and audit guidance.",
  image: project.image,
  imageAlt: project.imageAlt,
});

export default function CCRPage() {
  return <PrivateProjectCaseStudy project={project} />;
}
