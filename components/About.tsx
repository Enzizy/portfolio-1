import { services } from "@/data/portfolio";
import { MotionSection } from "./MotionSection";
import { SectionHeading } from "./SectionHeading";

export function About() {
  return (
    <MotionSection id="about" labelledBy="about-title" className="section about-section">
      <SectionHeading number="01" title="About" id="about-title" />
      <div className="about-copy">
        <p>I&apos;m a freelance full-stack developer passionate about building modern websites, AI-powered applications, and intuitive user experiences.</p>
        <p>From business websites to custom software and AI automation, I enjoy transforming ideas into products that are simple, efficient, and impactful.</p>
        <p>I continuously explore emerging technologies in artificial intelligence, automation, and interactive web experiences.</p>
      </div>
      <div className="services">
        <h3>What I Do</h3>
        {services.map(({ icon: Icon, title, description }) => (
          <div className="service-row" key={title}>
            <span className="service-icon"><Icon size={17} strokeWidth={1.7} /></span>
            <h4>{title}</h4>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </MotionSection>
  );
}
