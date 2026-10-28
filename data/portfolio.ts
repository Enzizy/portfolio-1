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
    description: "A full-stack HR and payroll platform: employee records, attendance import and review, day and night pay runs with approval, payslips, government contributions, 13th-month and SIL reports, leave workflows, and announcements.",
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
    title: "CasaToon",
    description: "An AI story studio, formerly Roarly, that turns a typed idea into a short animated video in one of five art styles, with accounts, free and paid plans, and a live product site.",
    technologies: ["Node.js", "SQLite", "AI animation"],
    visual: "casatoon" as const,
    href: "/projects/casatoon",
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
  {
    number: "10",
    title: "Joyno Accounting",
    description: "A collaborative accounting system I co-built, with journals, a general ledger and financial statements, sales and purchase documents, banking, assets, tax and payroll record tracking, and company-scoped roles and audit trails.",
    technologies: ["Vue 3", "Express", "PostgreSQL"],
    visual: "joyno-accounting" as const,
    href: "/projects/joyno-accounting",
  },
  {
    number: "11",
    title: "Enzi",
    description: "A customizable Dynamic Island-style notch for Windows with music and synced lyrics, a focus timer, to-do list, file shelf, image converter, clipboard history and quick actions, in a 2.4 MB app.",
    technologies: ["Rust", "Tauri 2", "Windows APIs"],
    visual: "enzi" as const,
    href: "/projects/enzi",
  },
] as const;

export const stackGroups = [
  { title: "Web", items: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Vue", "Tailwind CSS", "Vite"] },
  { title: "Mobile", items: ["React Native", "Expo", "Flutter", "Dart", "Kotlin"] },
  { title: "Backend & Data", items: ["Node.js", "Express", "Python", "REST APIs", "PostgreSQL", "Supabase", "Firebase Firestore", "SQLite"] },
  { title: "AI Tools", items: ["AI APIs", "Local AI", "ComfyUI", "LM Studio", "Ollama"] },
  { title: "CMS & Workflow", items: ["WordPress", "Elementor", "Figma", "Git", "GitHub", "Docker"] },
] as const;
