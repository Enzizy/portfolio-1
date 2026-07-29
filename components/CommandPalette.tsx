"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Cat,
  Copy,
  Download,
  Facebook,
  FileText,
  Gamepad2,
  Github,
  Linkedin,
  Mail,
  MessageCircle,
  MoonStar,
  Radio,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { projects } from "@/data/portfolio";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { toggleDocumentTheme } from "@/lib/theme";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenGame: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function CommandPalette({ isOpen, onClose, onOpenGame, returnFocusRef }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => setPortalRoot(document.body), []);

  const commands = useMemo(() => {
    const projectCommands = projects.map((project) => ({
      title: `Open ${project.title}`,
      description: project.description,
      icon: BriefcaseBusiness,
      keywords: `project case study ${project.technologies.join(" ")}`,
      run: () => router.push(project.href),
    }));

    return [
      ...projectCommands,
      { title: "View all projects", description: "Browse the complete project archive", icon: BriefcaseBusiness, keywords: "work portfolio archive", run: () => router.push("/projects") },
      { title: "What I’m doing now", description: "Jump to my current focus and availability", icon: Radio, keywords: "currently now availability", run: () => router.push("/#currently") },
      { title: "Contact me", description: "Start a conversation about your project", icon: MessageCircle, keywords: "hire freelance form", run: () => router.push("/#contact") },
      { title: "Copy email address", description: "zhyronnebatican@gmail.com", icon: Copy, keywords: "copy message mail", run: async () => {
        await navigator.clipboard.writeText("zhyronnebatican@gmail.com");
        window.dispatchEvent(new CustomEvent("portfolio:notify", { detail: "Email copied to clipboard." }));
      } },
      { title: "Send an email", description: "Open your email application", icon: Mail, keywords: "message mail", run: () => { window.location.href = "mailto:zhyronnebatican@gmail.com"; } },
      { title: "Preview resume", description: "Open the resume in a new tab", icon: FileText, keywords: "cv experience view", run: () => window.open("/resume.pdf", "_blank", "noopener,noreferrer") },
      { title: "Download resume", description: "Save a PDF copy of my resume", icon: Download, keywords: "cv experience pdf", run: () => { const link = document.createElement("a"); link.href = "/resume.pdf"; link.download = "Zhyronne-Batican-Resume.pdf"; link.click(); } },
      { title: "Open GitHub", description: "Repositories and development activity", icon: Github, keywords: "code repository social", run: () => window.open("https://github.com/Enzizy", "_blank", "noopener,noreferrer") },
      { title: "Open LinkedIn", description: "Professional profile and experience", icon: Linkedin, keywords: "social professional", run: () => window.open("https://www.linkedin.com/in/zhyronne-batican-5458a53aa/", "_blank", "noopener,noreferrer") },
      { title: "Open Facebook", description: "Visit my Facebook profile", icon: Facebook, keywords: "social profile", run: () => window.open("https://www.facebook.com/Hakdog.Hakplas.Haler", "_blank", "noopener,noreferrer") },
      { title: "Play Cat Runner", description: "Take a quick interactive break", icon: Gamepad2, keywords: "game arcade", run: onOpenGame },
      { title: "Toggle cat companion", description: "Hide or show the roaming portfolio cat", icon: Cat, keywords: "pet hide show accessibility", run: () => window.dispatchEvent(new Event("portfolio:toggle-cat")) },
      { title: "Toggle theme", description: "Switch between light and dark mode", icon: MoonStar, keywords: "appearance dark light", run: () => toggleDocumentTheme({ x: window.innerWidth / 2, y: 72 }) },
    ];
  }, [onOpenGame, router]);

  const filteredCommands = commands.filter((command) => {
    const searchText = `${command.title} ${command.description} ${command.keywords}`.toLowerCase();
    return searchText.includes(query.trim().toLowerCase());
  });

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
  }, [isOpen]);

  useEffect(() => setActiveIndex(0), [query]);
  useDialogFocusTrap(isOpen, dialogRef, inputRef, onClose, returnFocusRef);

  const runCommand = (command: (typeof commands)[number]) => {
    onClose();
    command.run();
  };

  if (!portalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="command-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            ref={dialogRef}
            className="command-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="command-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only" id="command-title">Portfolio command menu</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((index) => Math.min(index + 1, filteredCommands.length - 1));
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((index) => Math.max(index - 1, 0));
                  }
                  if (event.key === "Enter" && filteredCommands[activeIndex]) runCommand(filteredCommands[activeIndex]);
                }}
                placeholder="Type a command or search…"
                aria-label="Search commands"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="command-results"
                aria-expanded="true"
                aria-activedescendant={filteredCommands[activeIndex] ? `command-option-${activeIndex}` : undefined}
              />
              <kbd>ESC</kbd>
            </div>

            <div className="command-results" id="command-results" role="listbox" aria-label="Commands">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon;
                return (
                  <button
                    key={command.title}
                    id={`command-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={index === activeIndex ? "command-item command-item--active" : "command-item"}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runCommand(command)}
                  >
                    <span><Icon size={17} /></span>
                    <span><b>{command.title}</b><small>{command.description}</small></span>
                    <kbd>↵</kbd>
                  </button>
                );
              })}
              {filteredCommands.length === 0 && <p className="command-empty">No matching commands.</p>}
            </div>

            <footer className="command-footer"><span>↑↓ Navigate</span><span>↵ Select</span><span>Ctrl K Anytime</span></footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot,
  );
}
