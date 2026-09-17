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
  image: "/images/projects/ccr.png",
  imageAlt: "CCR's actual dashboard running with a fresh local database and no business records",
  imageNote: "Actual CCR dashboard, captured in local demo mode with an empty database. No business records are shown.",
  story: {
    challenge: "Purchase orders, deliveries, and collections are easy to lose track of when each step lives in a different record. The team needed a clear view of what was fulfilled, what was billed, and what was still owed.",
    decisions: "I connected the order lifecycle from purchase order to partial delivery, receipt, statement, and payment. I kept expenses and delivery issues close to that flow, while limiting the internal AI assistant to read-only guidance for audit questions.",
    result: "CCR provides one place to trace an order through fulfillment and collection, review outstanding balances, and investigate operational questions without giving the assistant permission to alter business records.",
  },
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
