import GlowBackground from "./GlowBackground";
import ScrollProgress from "./ScrollProgress";
import HomepageNav from "./HomepageNav";
import Hero from "./Hero";
import TheProblem from "./TheProblem";
import IndiaContext from "./IndiaContext";
import HowItWorks from "./HowItWorks";
import FeatureHighlights from "./FeatureHighlights";
import EmergencyNumbers from "./EmergencyNumbers";
import CapabilityStats from "./CapabilityStats";
import Footer from "./Footer";

export default function Homepage() {
  return (
    <div className="relative min-h-[100dvh] bg-bg text-text overflow-hidden">
      <ScrollProgress />
      <GlowBackground />
      <HomepageNav />
      <Hero />
      <TheProblem />
      <IndiaContext />
      <HowItWorks />
      <FeatureHighlights />
      <EmergencyNumbers />
      <CapabilityStats />
      <Footer />
    </div>
  );
}
