"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Command, Gamepad2, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems } from "@/data/portfolio";
import { ArcadeGame } from "./ArcadeGame";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";

export function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const openCommands = () => {
      setIsOpen(false);
      setIsGameOpen(false);
      setIsCommandOpen(true);
    };
    const openGame = () => {
      setIsOpen(false);
      setIsCommandOpen(false);
      setIsGameOpen(true);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandOpen((open) => {
          if (!open) {
            setIsOpen(false);
            setIsGameOpen(false);
          }
          return !open;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("portfolio:open-commands", openCommands);
    window.addEventListener("portfolio:open-game", openGame);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("portfolio:open-commands", openCommands);
      window.removeEventListener("portfolio:open-game", openGame);
    };
  }, []);

  const sectionHref = (target: string) => pathname === "/" ? `#${target}` : `/#${target}`;
  const openCommands = () => {
    setIsOpen(false);
    setIsGameOpen(false);
    setIsCommandOpen(true);
  };

  return (
    <header className={`site-header ${isScrolled ? "site-header--scrolled" : ""}`}>
      <nav className="nav-shell" aria-label="Primary navigation">
        <a href={pathname === "/" ? "#top" : "/"} className="logo" aria-label="Zhyronne Batican, home">ZB<span>.</span></a>

        <div className="desktop-nav">
          {navItems.map((item) => {
            const target = item === "Services" ? "about" : item === "Skills" ? "skills" : item.toLowerCase();
            return <a key={item} href={sectionHref(target)}>/{item.toUpperCase()}</a>;
          })}
          <button className="command-trigger" type="button" onClick={openCommands} aria-label="Open command menu"><Command size={13} />CTRL K</button>
          <ThemeToggle />
          <button className="play-button" type="button" onClick={() => setIsGameOpen(true)}><Gamepad2 size={14} />PLAY</button>
        </div>

        <button
          className="menu-button"
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            className="mobile-nav"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {navItems.map((item) => {
              const target = item === "Services" ? "about" : item === "Skills" ? "skills" : item.toLowerCase();
              return <a key={item} href={sectionHref(target)} onClick={() => setIsOpen(false)}>/{item.toUpperCase()}</a>;
            })}
            <button className="mobile-command-button" type="button" onClick={openCommands}><Command size={16} />/COMMAND MENU <kbd>CTRL K</kbd></button>
            <ThemeToggle mobile />
            <button className="mobile-play-button" type="button" onClick={() => { setIsOpen(false); setIsGameOpen(true); }}><Gamepad2 size={16} />/PLAY</button>
          </motion.nav>
        )}
      </AnimatePresence>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} onOpenGame={() => setIsGameOpen(true)} />
      <ArcadeGame isOpen={isGameOpen} onClose={() => setIsGameOpen(false)} />
    </header>
  );
}
