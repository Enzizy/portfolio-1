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
    title: "SakAI",
    description: "AI-powered commuter assistant designed to simplify public transportation.",
    technologies: ["Flutter", "Firebase", "AI"],
    visual: "mobile" as const,
  },
  {
    number: "02",
    title: "HR Management System",
    description: "A complete employee management platform with authentication, leave requests, task management, and role-based access.",
    technologies: ["Vue", "Node.js", "Supabase"],
    visual: "dashboard" as const,
  },
  {
    number: "03",
    title: "Restaurant Website",
    description: "A responsive restaurant website featuring dynamic menus, multilingual support, and optimized user experience.",
    technologies: ["WordPress", "JavaScript", "SEO"],
    visual: "restaurant" as const,
  },
] as const;

export const stackGroups = [
  { title: "Frontend", items: ["Vue.js", "React", "Flutter", "HTML", "CSS", "JavaScript", "TypeScript"] },
  { title: "Backend", items: ["Node.js", "Express", "Python"] },
  { title: "Database", items: ["Supabase", "Firebase", "MySQL"] },
  { title: "AI & Tools", items: ["OpenAI API", "Ollama", "ComfyUI", "Local LLMs", "Prompt Engineering"] },
  { title: "Tools & Others", items: ["Git", "Docker", "Figma", "WordPress", "Elementor"] },
] as const;
