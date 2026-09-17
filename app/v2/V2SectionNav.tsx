"use client";

import { Code2, Folder, Home, Layers3, MessageCircle, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

const sections = [
  { id: "home", label: "Home", icon: Home },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "services", label: "Services", icon: Layers3 },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "about", label: "About", icon: UserRound },
  { id: "contact", label: "Contact", icon: MessageCircle },
] as const;

export function V2SectionNav({ placement }: { placement: "sidebar" | "mobile" }) {
  const [activeSection, setActiveSection] = useState<string>("home");

  useEffect(() => {
    const targets = sections.map(({ id }) => document.getElementById(id));
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      const readingLine = window.scrollY + window.innerHeight * 0.35;
      let active: string = sections[0].id;

      targets.forEach((target, index) => {
        if (target && target.getBoundingClientRect().top + window.scrollY <= readingLine) {
          active = sections[index].id;
        }
      });

      setActiveSection(active);
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const items = placement === "mobile"
    ? [sections[0], sections[1], sections[5], sections[3], sections[4]]
    : sections;

  return (
    <nav className={placement === "mobile" ? "v2-bottom-nav" : "v2-side-nav"} aria-label={`Version 2 ${placement === "mobile" ? "mobile" : "sections"} navigation`}>
      {items.map(({ id, label, icon: Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          className={placement === "mobile" && id === "contact" ? "v2-bottom-nav__contact" : undefined}
          aria-current={activeSection === id ? "location" : undefined}
          onClick={() => setActiveSection(id)}
        >
          <Icon size={placement === "mobile" ? 20 : 18} aria-hidden="true" />
          <span>{placement === "mobile" && id === "projects" ? "Work" : label}</span>
        </a>
      ))}
    </nav>
  );
}
