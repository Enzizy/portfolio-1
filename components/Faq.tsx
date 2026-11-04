import { faqs } from "@/data/portfolio";
import { JsonLd } from "./JsonLd";
import { MotionSection } from "./MotionSection";
import { SectionHeading } from "./SectionHeading";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export function Faq() {
  return (
    <MotionSection id="faq" labelledBy="faq-title" className="section faq-section">
      <SectionHeading number="05" title="FAQ" id="faq-title" />
      <div className="faq-list">
        {faqs.map(({ question, answer }) => (
          <details key={question}>
            <summary><h3>{question}</h3></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqSchema} />
    </MotionSection>
  );
}
