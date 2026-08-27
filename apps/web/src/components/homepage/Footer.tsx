import Link from "next/link";
import EnterAppLink from "./EnterAppLink";

export default function Footer() {
  return (
    <footer className="relative z-10 px-6 md:px-10 pt-14 pb-10 border-t border-white/10">
      <div className="flex flex-wrap justify-between gap-10">
        <div className="max-w-[30ch]">
          <p className="text-2xl md:text-3xl font-bold tracking-[-0.02em] leading-[1.15] mb-3">
            The nearest help, found and sent.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            Live alerts, citizen reports and available resources on one map — so the decision takes a click,
            not a chain of phone calls.
          </p>
        </div>

        <nav className="flex flex-wrap gap-10 font-mono text-xs text-text-muted" aria-label="Footer">
          <div className="flex flex-col gap-2.5">
            <span className="text-text">Use it</span>
            <EnterAppLink role="citizen" className="text-left hover:text-text transition-colors">
              Report an incident
            </EnterAppLink>
            <EnterAppLink role="authority" className="text-left hover:text-text transition-colors">
              Authority console
            </EnterAppLink>
            <Link href="/map" className="hover:text-text transition-colors">
              Public live map
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-text">About</span>
            <a href="#problem" className="hover:text-text transition-colors">
              The problem
            </a>
            <a href="#how-it-works" className="hover:text-text transition-colors">
              How it works
            </a>
            <a href="#features" className="hover:text-text transition-colors">
              What it does
            </a>
          </div>

          {/* Real helplines, not decoration — the one part of this page that is
              useful during an actual emergency. */}
          <div className="flex flex-col gap-2.5">
            <span className="text-text">Emergency</span>
            <a href="tel:112" className="hover:text-text transition-colors">
              112 · All emergencies
            </a>
            <a href="tel:108" className="hover:text-text transition-colors">
              108 · Ambulance
            </a>
            <a href="tel:1078" className="hover:text-text transition-colors">
              1078 · Disaster (NDMA)
            </a>
          </div>
        </nav>
      </div>

      <div className="mt-12 pt-6 border-t border-white/[0.06] font-mono text-[0.68rem] text-text-muted">
        <span>Alerts ingested from SACHET (NDMA) — carrying IMD, CWC and state SDMA warnings</span>
      </div>
    </footer>
  );
}
