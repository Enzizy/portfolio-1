import { Download, Facebook, Github, Linkedin, Mail } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { MotionSection } from "./MotionSection";
import { SectionHeading } from "./SectionHeading";

const contactLinks = [
  { icon: Mail, label: "zhyronnebatican@gmail.com", href: "mailto:zhyronnebatican@gmail.com" },
  {
    icon: Linkedin,
    label: "linkedin.com/in/zhyronne-batican",
    href: "https://www.linkedin.com/in/zhyronne-batican-5458a53aa/",
  },
  {
    icon: Facebook,
    label: "facebook.com/Hakdog.Hakplas.Haler",
    href: "https://www.facebook.com/Hakdog.Hakplas.Haler",
  },
  { icon: Github, label: "github.com/Enzizy", href: "https://github.com/Enzizy" },
  { icon: Download, label: "Download Resume", href: "/resume.pdf", download: true },
];

export function Contact() {
  return (
    <MotionSection id="contact" labelledBy="contact-title" className="section contact-section">
      <SectionHeading number="05" title="Let's Connect" id="contact-title" />
      <div className="contact-copy">
        <h2>Let&apos;s build something<br />amazing together.</h2>
        <p>I&apos;m currently available for freelance projects.</p>
      </div>
      <div className="contact-panel">
        <ContactForm />
        <div className="contact-links">
          {contactLinks.map(({ icon: Icon, label, ...link }) => (
            <a key={label} {...link} target={link.download ? undefined : link.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              <span><Icon size={16} /></span>{label}
            </a>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
