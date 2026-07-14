"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import Image from "next/image";

const socials = [
  { label: "GitHub", icon: Github, href: "https://github.com/zhyronnebatican" },
  { label: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/in/zhyronnebatican" },
  { label: "Email", icon: Mail, href: "mailto:zhyronnebatican@gmail.com" },
];

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <motion.div
        className="hero-copy"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <p className="eyebrow">// HELLO, I&apos;M</p>
        <h1 id="hero-title">Zhyronne<br />Batican</h1>
        <div className="roles">
          <span>Full Stack Developer</span>
          <span>AI Engineer</span>
          <span>UI/UX Designer</span>
        </div>
        <p className="hero-description">
          I build modern web applications, AI-powered tools, and digital experiences that are fast,
          scalable, and designed with purpose.
        </p>
        <div className="hero-actions">
          <a className="button button--dark" href="#projects">View Projects <ArrowUpRight size={15} /></a>
          <a className="button button--light" href="#contact">Let&apos;s Work Together <ArrowUpRight size={15} /></a>
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
            src="/images/portrait-placeholder.png"
            alt="Professional portrait placeholder for Zhyronne Batican"
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
