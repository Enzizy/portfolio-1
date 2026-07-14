import { ArrowUpRight, Download, Github, Linkedin, Mail } from "lucide-react";
import { MotionSection } from "./MotionSection";
import { SectionHeading } from "./SectionHeading";

const contactLinks = [
  { icon: Mail, label: "zhyronnebatican@gmail.com", href: "mailto:zhyronnebatican@gmail.com" },
  { icon: Linkedin, label: "linkedin.com/in/zhyronnebatican", href: "https://linkedin.com/in/zhyronnebatican" },
  { icon: Github, label: "github.com/zhyronnebatican", href: "https://github.com/zhyronnebatican" },
  { icon: Download, label: "Download Resume", href: "/resume.pdf", download: true },
];

export function Contact() {
  return (
    <MotionSection id="contact" labelledBy="contact-title" className="section contact-section">
      <SectionHeading number="04" title="Let's Connect" id="contact-title" />
      <div className="contact-copy">
        <h2>Let&apos;s build something<br />amazing together.</h2>
        <p>I&apos;m currently available for freelance projects.</p>
        <a href="mailto:zhyronnebatican@gmail.com" className="button button--dark">Send a Message <ArrowUpRight size={15} /></a>
      </div>
      <div className="contact-links">
        {contactLinks.map(({ icon: Icon, label, ...link }) => (
          <a key={label} {...link} target={link.download ? undefined : link.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
            <span><Icon size={16} /></span>{label}
          </a>
        ))}
      </div>
    </MotionSection>
  );
}
