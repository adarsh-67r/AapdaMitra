import PaperGround from "./PaperGround";
import ScrollProgress from "./ScrollProgress";
import HomepageNav from "./HomepageNav";
import Hero from "./Hero";
import TheProblem from "./TheProblem";
import IndiaHazardMap from "./IndiaHazardMap";
import HowItWorks from "./HowItWorks";
import FeatureHighlights from "./FeatureHighlights";
import EmergencyNumbers from "./EmergencyNumbers";
import CapabilityStats from "./CapabilityStats";
import Footer from "./Footer";

// overflow-x-clip, not overflow-hidden: `hidden` makes the wrapper a scroll
// container, which silently disables `position: sticky` on every descendant —
// including the pinned how-it-works sequence. `clip` contains the glow blobs
// without that side effect.
export default function Homepage() {
  return (
    <div className="relative min-h-[100dvh] bg-bg text-text overflow-x-clip">
      <ScrollProgress />
      <PaperGround />
      <HomepageNav />
      <Hero />
      <TheProblem />
      <IndiaHazardMap />
      <HowItWorks />
      <FeatureHighlights />
      <EmergencyNumbers />
      <CapabilityStats />
      <Footer />
    </div>
  );
}
