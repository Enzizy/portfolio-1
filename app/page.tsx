import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { GitHubActivity } from "@/components/GitHubActivity";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Navigation } from "@/components/Navigation";
import { PixelCatCompanion } from "@/components/PixelCatCompanion";
import { Projects } from "@/components/Projects";
import { TechStack } from "@/components/TechStack";
import { siteUrl } from "@/lib/site";

const profileSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${siteUrl}/#profile`,
  url: siteUrl,
  name: "Zhyronne Batican",
  dateModified: "2026-11-04",
  isPartOf: { "@id": `${siteUrl}/#website` },
  mainEntity: { "@id": `${siteUrl}/#person` },
};

export default function Home() {
  return (
    <>
      <JsonLd data={profileSchema} />
      <Navigation />
      <PixelCatCompanion />
      <main id="main-content" className="page-shell" tabIndex={-1}>
        <Hero />
        <About />
        <Projects />
        <TechStack />
        <GitHubActivity />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
