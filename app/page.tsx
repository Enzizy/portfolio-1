import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { GitHubActivity } from "@/components/GitHubActivity";
import { Hero } from "@/components/Hero";
import { Navigation } from "@/components/Navigation";
import { PixelCatCompanion } from "@/components/PixelCatCompanion";
import { Projects } from "@/components/Projects";
import { TechStack } from "@/components/TechStack";

export default function Home() {
  return (
    <>
      <Navigation />
      <PixelCatCompanion />
      <main id="main-content" className="page-shell" tabIndex={-1}>
        <Hero />
        <About />
        <Projects />
        <TechStack />
        <GitHubActivity />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
