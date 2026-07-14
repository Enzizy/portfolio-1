"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navItems } from "@/data/portfolio";
import { ArcadeGame } from "./ArcadeGame";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${isScrolled ? "site-header--scrolled" : ""}`}>
      <nav className="nav-shell" aria-label="Primary navigation">
        <a href="#top" className="logo" aria-label="Zhyronne Batican, home">ZB<span>.</span></a>

        <div className="desktop-nav">
          {navItems.map((item) => {
            const target = item === "Services" ? "about" : item === "Skills" ? "skills" : item.toLowerCase();
            return <a key={item} href={`#${target}`}>/{item.toUpperCase()}</a>;
          })}
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
              return <a key={item} href={`#${target}`} onClick={() => setIsOpen(false)}>/{item.toUpperCase()}</a>;
            })}
            <button className="mobile-play-button" type="button" onClick={() => { setIsOpen(false); setIsGameOpen(true); }}><Gamepad2 size={16} />/PLAY</button>
          </motion.nav>
        )}
      </AnimatePresence>
      <ArcadeGame isOpen={isGameOpen} onClose={() => setIsGameOpen(false)} />
    </header>
  );
}
