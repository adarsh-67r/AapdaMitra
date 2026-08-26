import Link from "next/link";
import EnterAppLink from "./EnterAppLink";

export default function Footer() {
  return (
    <footer className="relative z-10 px-6 md:px-10 py-10 border-t border-white/10">
      <div className="flex flex-wrap justify-between gap-6">
        <p className="font-semibold">
          Report it. Route it.
          <br />
          Resolve it.
        </p>
        <div className="flex gap-10 font-mono text-xs text-text-muted">
          <div className="flex flex-col gap-2">
            <EnterAppLink role="citizen" className="text-left hover:text-text transition-colors">
              Report Incident
            </EnterAppLink>
            <Link href="/map" className="hover:text-text transition-colors">
              Live Map
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <a href="#problem" className="hover:text-text transition-colors">
              The Problem
            </a>
            <a href="#how-it-works" className="hover:text-text transition-colors">
              How it works
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <a href="#features" className="hover:text-text transition-colors">
              What it does
            </a>
            <a href="tel:112" className="hover:text-text transition-colors">
              Emergency: 112
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
