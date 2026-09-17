"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Facebook, Github, Linkedin, Mail } from "lucide-react";
import Image from "next/image";
import { TextType } from "@/components/TextType";

const socials = [
  { label: "GitHub", icon: Github, href: "https://github.com/Enzizy" },
  { label: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/in/zhyronne-batican-5458a53aa/" },
  { label: "Facebook", icon: Facebook, href: "https://www.facebook.com/Hakdog.Hakplas.Haler" },
  { label: "Email", icon: Mail, href: "mailto:zhyronnebatican@gmail.com" },
];

const roles = ["Full Stack Developer", "AI Engineer", "UI/UX Designer"];

export function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-title" data-cat-zone-root="top">
      <motion.div
        className="hero-copy"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <p className="eyebrow">// HELLO, I&apos;M</p>
        <h1 id="hero-title" data-cat-perch data-cat-zone="top" data-cat-kind="hero">Zhyronne<br />Batican</h1>
        <div className="roles">
          <span className="sr-only">Full Stack Developer, AI Engineer, and UI/UX Designer</span>
          <TextType
            text={roles}
            as="span"
            aria-hidden="true"
            typingSpeed={58}
            deletingSpeed={24}
            initialDelay={2050}
            pauseDuration={1800}
            variableSpeed={{ min: 42, max: 74 }}
            cursorCharacter="_"
            cursorBlinkDuration={0.42}
          />
        </div>
        <p className="hero-description">
          I build custom web apps, WordPress sites, landing pages, mobile tools, and AI-assisted workflows.
        </p>
        <div className="hero-actions">
          <a className="button button--dark" href="#projects" data-cat-perch data-cat-zone="top" data-cat-kind="button">View Projects <ArrowUpRight size={15} /></a>
          <a className="button button--light" href="#contact" data-cat-perch data-cat-zone="top" data-cat-kind="button">Let&apos;s Work Together <ArrowUpRight size={15} /></a>
        </div>
        <p className="availability"><i aria-hidden="true" />Available for freelance projects</p>
      </motion.div>

      <motion.div
        className="hero-media"
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, delay: 0.08 }}
      >
        <div className="dot-grid" aria-hidden="true" />
        <motion.div className="portrait-frame" whileHover={{ scale: 1.015 }} transition={{ duration: 0.2 }}>
          <Image
            src="/images/me.jpg"
            alt="Portrait of Zhyronne Batican"
            fill
            priority
            sizes="(max-width: 767px) 86vw, 38vw"
          />
        </motion.div>
        <div className="social-list" aria-label="Social links">
          {socials.map(({ label, icon: Icon, href }) => (
            <a key={label} href={href} target={label === "Email" ? undefined : "_blank"} rel="noreferrer">
              <span><Icon size={15} /></span>{label}<i aria-hidden="true" />
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
