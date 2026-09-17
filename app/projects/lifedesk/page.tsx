import { PrivateProjectCaseStudy, type PrivateProjectDetails } from "@/components/PrivateProjectCaseStudy";
import { createProjectMetadata } from "@/lib/metadata";

const project: PrivateProjectDetails = {
  number: "09",
  title: "LifeDesk",
  category: "PERSONAL COMMAND CENTER",
  introduction: "An Android-first home for daily tasks, personal finances, investments, and AI-assisted planning.",
  role: "Mobile product development",
  platform: "Personal Android application",
  coreStack: "React Native · Expo · SQLite",
  image: "/images/projects/lifedesk.svg",
  imageAlt: "Illustration of LifeDesk's tasks, money, investments, and AI assistant; no personal records are shown",
  imageNote: "Illustrative feature overview, not an app screenshot. Personal records are private.",
  overview: [
    "LifeDesk is my local-first personal command center for staying on top of what I need to do and where my money stands.",
    "It brings tasks, reminders, projects, income, expenses, bills, budgets, and recorded investment positions into one app. Investment values are estimates with a source and timestamp, rather than brokerage account balances.",
    "The AI assistant helps organize plans and suggestions. Changes to local records require review before saving, and the app supports local JSON export and restore.",
  ],
  features: [
    "Manage tasks, reminders, and projects",
    "Record income, spending, bills, and monthly budgets",
    "Track recurring salary, payment, and investment schedules",
    "View recorded stock and crypto positions with estimated values",
    "Review AI suggestions before they change records",
    "Export and restore local data as JSON",
  ],
  architecture: [
    { label: "Mobile", value: "Expo SDK 57, React Native, and Expo Router" },
    { label: "Storage", value: "On-device SQLite with monetary amounts stored in integer centavos" },
    { label: "Assistant", value: "Gemini-backed suggestions reviewed before saving" },
    { label: "Market data", value: "Optional Twelve Data quotes with recorded source and update time" },
  ],
  href: "/projects/lifedesk",
};

export const metadata = createProjectMetadata({
  title: "LifeDesk — Personal Command Center",
  description: "A local-first Android app for tasks, budgets, bills, investments, and review-before-save AI assistance.",
  image: project.image,
  imageAlt: project.imageAlt,
});

export default function LifeDeskPage() {
  return <PrivateProjectCaseStudy project={project} />;
}
