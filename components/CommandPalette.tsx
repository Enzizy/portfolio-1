"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BriefcaseBusiness, Download, Gamepad2, Github, Mail, MessageCircle, MoonStar, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toggleDocumentTheme } from "@/lib/theme";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenGame: () => void;
};

export function CommandPalette({ isOpen, onClose, onOpenGame }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => setPortalRoot(document.body), []);

  const commands = useMemo(() => [
    { title: "View all projects", description: "Browse the complete project archive", icon: BriefcaseBusiness, keywords: "work portfolio", run: () => router.push("/projects") },
    { title: "Contact me", description: "Start a conversation about your project", icon: MessageCircle, keywords: "hire freelance", run: () => router.push("/#contact") },
    { title: "Send an email", description: "zhyronnebatican@gmail.com", icon: Mail, keywords: "message mail", run: () => { window.location.href = "mailto:zhyronnebatican@gmail.com"; } },
    { title: "Open GitHub", description: "See repositories and development work", icon: Github, keywords: "code repository", run: () => window.open("https://github.com/zhyronnebatican", "_blank", "noopener,noreferrer") },
    { title: "Download resume", description: "Save a copy of my resume", icon: Download, keywords: "cv experience", run: () => { const link = document.createElement("a"); link.href = "/resume.pdf"; link.download = "Zhyronne-Batican-Resume.pdf"; link.click(); } },
    { title: "Play Cat Runner", description: "Take a quick interactive break", icon: Gamepad2, keywords: "game arcade", run: onOpenGame },
    { title: "Toggle theme", description: "Switch between light and dark mode", icon: MoonStar, keywords: "appearance dark light", run: () => toggleDocumentTheme({ x: window.innerWidth / 2, y: 72 }) },
  ], [onOpenGame, router]);

  const filteredCommands = commands.filter((command) => {
    const searchText = `${command.title} ${command.description} ${command.keywords}`.toLowerCase();
    return searchText.includes(query.trim().toLowerCase());
  });

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  useEffect(() => setActiveIndex(0), [query]);

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
            className="command-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Portfolio command menu"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="command-search">
              <Search size={17} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") onClose();
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
              />
              <kbd>ESC</kbd>
            </div>

            <div className="command-results" role="listbox" aria-label="Commands">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon;
                return (
                  <button
                    key={command.title}
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
