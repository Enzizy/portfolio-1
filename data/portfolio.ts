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
    title: "B&W Furnitures",
    description: "A portfolio-focused WordPress website showcasing customized furniture, modular cabinetry, service categories, project galleries, and customer inquiry paths.",
    technologies: ["WordPress", "UI/UX", "Responsive"],
    visual: "furniture" as const,
    href: "/projects/bw-furniture",
  },
  {
    number: "04",
    title: "BookVoice",
    description: "A local-first Windows audiobook studio that converts documents into speech with Piper or Kokoro and provides a multitrack editor for narration, ambience, and effects.",
    technologies: ["Electron", "Python", "Local TTS"],
    visual: "bookvoice" as const,
    href: "/projects/bookvoice",
  },
  {
    number: "05",
    title: "CasaToon",
    description: "An AI story studio, formerly Roarly, that turns a typed idea into a short animated video in one of five art styles, with accounts, free and paid plans, and a live product site.",
    technologies: ["Node.js", "SQLite", "AI animation"],
    visual: "casatoon" as const,
    href: "/projects/casatoon",
  },
  {
    number: "06",
    title: "CCR",
    description: "An internal operations system connecting purchase orders, deliveries, receivables, payments, expenses, and an AI assistant for audit guidance.",
    technologies: ["Vue.js", "Supabase", "AI Assistant"],
    visual: "ccr" as const,
    href: "/projects/ccr",
  },
  {
    number: "07",
    title: "LifeDesk CRM",
    description: "A personal prospecting workspace for discovering local businesses, reviewing AI-qualified leads, drafting outreach, and managing a sales pipeline.",
    technologies: ["React", "Supabase", "AI workflows"],
    visual: "lifedesk-crm" as const,
    href: "/projects/lifedesk-crm",
  },
  {
    number: "08",
    title: "LifeDesk",
    description: "A local-first personal app for tasks, bills, budgets, investments, and review-before-save AI assistance.",
    technologies: ["React Native", "Expo", "SQLite"],
    visual: "lifedesk" as const,
    href: "/projects/lifedesk",
  },
  {
    number: "09",
    title: "Joyno Accounting",
    description: "A collaborative accounting system I co-built, with journals, a general ledger and financial statements, sales and purchase documents, banking, assets, tax and payroll record tracking, and company-scoped roles and audit trails.",
    technologies: ["Vue 3", "Express", "PostgreSQL"],
    visual: "joyno-accounting" as const,
    href: "/projects/joyno-accounting",
  },
  {
    number: "10",
    title: "Enzi",
    description: "A customizable Dynamic Island-style notch for Windows with music and synced lyrics, a focus timer, to-do list, file shelf, image converter, clipboard history and quick actions, in a 2.4 MB app.",
    technologies: ["Rust", "Tauri 2", "Windows APIs"],
    visual: "enzi" as const,
    href: "/projects/enzi",
  },
  {
    number: "11",
    title: "Joyno Chatbot",
    description: "A WordPress plugin and subscription service that gives small businesses a branded AI assistant, answering visitors in English and Filipino from the business's own FAQs and pages.",
    technologies: ["PHP", "Node.js", "Google Gemini"],
    visual: "joyno-chatbot" as const,
    href: "/projects/joyno-chatbot",
  },
] as const;

// Shown on the home page and published as FAQPage data, so answer engines can quote them directly.
export const faqs = [
  {
    question: "Who is Zhyronne Batican?",
    answer: "Zhyronne Batican is a freelance full-stack developer, AI engineer, and UI/UX designer based in the Philippines. He builds web apps, WordPress sites, landing pages, mobile apps, desktop tools, and AI-assisted workflows.",
  },
  {
    question: "What services does Zhyronne Batican offer?",
    answer: "He offers web development, WordPress sites and landing pages, AI chatbots and automation, mobile apps, UI/UX design, and SEO and performance work.",
  },
  {
    question: "What technologies does he work with?",
    answer: "His main stack includes TypeScript, React, Vue, Node.js, Express, Python, PostgreSQL, Supabase, Firebase, React Native, Flutter, Kotlin, and WordPress, plus AI APIs and local AI tools such as Ollama and LM Studio.",
  },
  {
    question: "What has he built?",
    answer: "His work includes Joyno HR, an HR and payroll platform; Joyno Accounting, a co-built accounting system; CasaToon, an AI story studio; Joyno Chatbot, an AI assistant for WordPress sites; Enzi, a customizable notch for Windows; and LocalAid, a community-help Android app.",
  },
  {
    question: "Can Zhyronne add AI to an existing website or business system?",
    answer: "Yes. He has built AI assistants into business software and websites, including the audit guidance assistant in CCR and the Joyno Chatbot plugin, which answers visitors from a business's own FAQs and pages.",
  },
  {
    question: "Is Zhyronne Batican available for freelance work?",
    answer: "Yes. He is available for freelance projects. You can reach him through the contact form on this site or at zhyronnebatican@gmail.com.",
  },
] as const;

export const stackGroups = [
  { title: "Web", items: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Vue", "Tailwind CSS", "Vite"] },
  { title: "Mobile", items: ["React Native", "Expo", "Flutter", "Dart", "Kotlin"] },
  { title: "Backend & Data", items: ["Node.js", "Express", "Python", "REST APIs", "PostgreSQL", "Supabase", "Firebase Firestore", "SQLite"] },
  { title: "AI Tools", items: ["AI APIs", "Local AI", "ComfyUI", "LM Studio", "Ollama"] },
  { title: "CMS & Workflow", items: ["WordPress", "Elementor", "Figma", "Git", "GitHub", "Docker"] },
] as const;
