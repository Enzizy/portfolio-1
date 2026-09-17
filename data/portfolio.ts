import { Bot, Code2, LayoutTemplate, PenTool, Smartphone, TrendingUp } from "lucide-react";

export const navItems = ["About", "Projects", "Services", "Skills", "Contact"] as const;

export const services = [
  { icon: Code2, title: "Web Development", previewTitle: "Web Apps", description: "Modern, responsive websites and web applications." },
  { icon: LayoutTemplate, title: "WordPress & Landing Pages", previewTitle: "WordPress", description: "Business sites and focused pages designed to turn visits into inquiries." },
  { icon: Bot, title: "AI Solutions", previewTitle: "AI Tools", description: "AI chatbots, automation, and local AI integrations." },
  { icon: Smartphone, title: "Mobile Apps", previewTitle: "Mobile Apps", description: "Native and cross-platform apps built with React Native, Flutter, and Kotlin." },
  { icon: PenTool, title: "UI/UX Design", previewTitle: "UI/UX Design", description: "Clean, user-focused interfaces and experiences." },
  { icon: TrendingUp, title: "SEO & Performance", previewTitle: "SEO & Speed", description: "Fast, optimized websites built for search engines." },
] as const;

export const projects = [
  {
    number: "01",
    title: "Joyno HR",
    description: "A full-stack HR operations platform for employee records, policy-aware leave workflows, approvals, workforce calendars, tasks, notifications, audit history, and reporting.",
    technologies: ["Vue.js", "Node.js", "PostgreSQL"],
    visual: "dashboard" as const,
    href: "/projects/joyno-hr",
  },
  {
    number: "02",
    title: "LocalAid",
    description: "A native Android app that connects nearby residents to request and offer help through location-aware posts, real-time chat, verification, ratings, and community rewards.",
    technologies: ["Kotlin", "Firebase", "Google Maps"],
    visual: "localaid" as const,
    href: "/projects/localaid",
  },
  {
    number: "03",
    title: "StreetKings PH",
    description: "A WordPress website for an auto painting and detailing business, presenting services, proof of work, reviews, FAQs, location details, and direct booking paths.",
    technologies: ["WordPress", "Web Design", "Responsive"],
    visual: "streetkings" as const,
    href: "/projects/streetkings",
  },
  {
    number: "04",
    title: "B&W Furnitures",
    description: "A portfolio-focused WordPress website showcasing customized furniture, modular cabinetry, service categories, project galleries, and customer inquiry paths.",
    technologies: ["WordPress", "UI/UX", "Responsive"],
    visual: "furniture" as const,
    href: "/projects/bw-furniture",
  },
  {
    number: "05",
    title: "BookVoice",
    description: "A local-first Windows audiobook studio that converts documents into speech with Piper or Kokoro and provides a multitrack editor for narration, ambience, and effects.",
    technologies: ["Electron", "Python", "Local TTS"],
    visual: "bookvoice" as const,
    href: "/projects/bookvoice",
  },
  {
    number: "06",
    title: "Roarly",
    description: "An AI animation studio marketing and checkout prototype with account management, flexible credit plans, PayMongo payments, and webhook-confirmed access.",
    technologies: ["Node.js", "SQLite", "PayMongo"],
    visual: "roarly" as const,
    href: "/projects/roarly",
  },
  {
    number: "07",
    title: "CCR",
    description: "An internal operations system connecting purchase orders, deliveries, receivables, payments, expenses, and an AI assistant for audit guidance.",
    technologies: ["Vue.js", "Supabase", "AI Assistant"],
    visual: "ccr" as const,
    href: "/projects/ccr",
  },
  {
    number: "08",
    title: "LifeDesk CRM",
    description: "A personal prospecting workspace for discovering local businesses, reviewing AI-qualified leads, drafting outreach, and managing a sales pipeline.",
    technologies: ["React", "Supabase", "AI workflows"],
    visual: "lifedesk-crm" as const,
    href: "/projects/lifedesk-crm",
  },
  {
    number: "09",
    title: "LifeDesk",
    description: "A local-first personal app for tasks, bills, budgets, investments, and review-before-save AI assistance.",
    technologies: ["React Native", "Expo", "SQLite"],
    visual: "lifedesk" as const,
    href: "/projects/lifedesk",
  },
] as const;

export const stackGroups = [
  { title: "Web", items: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Vue", "Tailwind CSS", "Vite"] },
  { title: "Mobile", items: ["React Native", "Expo", "Flutter", "Dart", "Kotlin"] },
  { title: "Backend & Data", items: ["Node.js", "Express", "Python", "REST APIs", "PostgreSQL", "Supabase", "Firebase Firestore", "SQLite"] },
  { title: "AI Tools", items: ["AI APIs", "Local AI", "ComfyUI", "LM Studio", "Ollama"] },
  { title: "CMS & Workflow", items: ["WordPress", "Elementor", "Figma", "Git", "GitHub", "Docker"] },
] as const;
