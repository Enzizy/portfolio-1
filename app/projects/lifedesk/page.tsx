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
  image: "/images/projects/lifedesk-home.png",
  imageAlt: "Actual LifeDesk home screen in an empty local web session",
  imageNote: "Actual LifeDesk home, wallet, and tasks screens captured from the web build with empty local records.",
  imageFit: "mobile",
  additionalImages: [
    { src: "/images/projects/lifedesk-wallet.png", alt: "LifeDesk wallet screen with no transactions or investment positions" },
    { src: "/images/projects/lifedesk-tasks.png", alt: "LifeDesk tasks screen with no saved tasks" },
  ],
  story: {
    challenge: "Tasks, bills, budgets, and investment notes were competing for attention across separate tools. I wanted one daily view that made upcoming obligations and financial context easy to understand without handing over my personal records.",
    decisions: "I built an Android-first, local-first workspace with tasks and money side by side. Investment values are shown as sourced estimates, and AI suggestions must be reviewed before they can change saved data.",
    result: "LifeDesk brings daily planning, payments, budgets, and recorded stock and crypto positions into one personal app. Local export and restore keep the information portable.",
  },
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
    { label: "Assistant", value: "AI suggestions reviewed before saving" },
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
