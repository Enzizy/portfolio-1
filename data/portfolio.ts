import { Bot, Code2, PenTool, Smartphone, TrendingUp } from "lucide-react";

export const navItems = ["About", "Projects", "Services", "Skills", "Contact"] as const;

export const services = [
  { icon: Code2, title: "Web Development", description: "Modern, responsive websites and web applications." },
  { icon: Bot, title: "AI Solutions", description: "AI chatbots, automation, and local AI integrations." },
  { icon: Smartphone, title: "Mobile Apps", description: "Cross-platform apps built with Flutter." },
  { icon: PenTool, title: "UI/UX Design", description: "Clean, user-focused interfaces and experiences." },
  { icon: TrendingUp, title: "SEO & Performance", description: "Fast, optimized websites built for search engines." },
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
] as const;

export const stackGroups = [
  { title: "Frontend", items: ["Vue.js", "React", "Flutter", "HTML", "CSS", "JavaScript", "TypeScript"] },
  { title: "Backend", items: ["Node.js", "Express", "Python"] },
  { title: "Database", items: ["Supabase", "Firebase", "MySQL"] },
  { title: "AI & Tools", items: ["OpenAI API", "Ollama", "ComfyUI", "Local LLMs", "Prompt Engineering"] },
  { title: "Tools & Others", items: ["Git", "Docker", "Figma", "WordPress", "Elementor"] },
] as const;
