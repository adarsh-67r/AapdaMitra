import GlowBackground from "./GlowBackground";
import HomepageNav from "./HomepageNav";
import Hero from "./Hero";
import TheProblem from "./TheProblem";
import HowItWorks from "./HowItWorks";
import FeatureHighlights from "./FeatureHighlights";
import EmergencyNumbers from "./EmergencyNumbers";
import CapabilityStats from "./CapabilityStats";
import Footer from "./Footer";

export default function Homepage() {
  return (
    <div className="relative min-h-screen bg-bg text-text overflow-hidden">
      <GlowBackground />
      <HomepageNav />
      <Hero />
      <TheProblem />
      <HowItWorks />
      <FeatureHighlights />
      <EmergencyNumbers />
      <CapabilityStats />
      <Footer />
    </div>
  );
}
