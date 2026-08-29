import BrandMark from "@/components/BrandMark";
import ThemeToggle from "@/components/ThemeToggle";
import EnterAppLink from "./EnterAppLink";

const pill =
"font-mono text-xs px-4 py-2 min-h-9 inline-flex items-center bg-panel border border-border hover:bg-panel-alt transition-colors";

export default function HomepageNav() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 gap-4">
      {/* A plain anchor, not next/link: a client-side navigation from / to /
          is a no-op, and clicking the mark you are already looking at should
          visibly start the page again. This is a real document load. */}
      <a href="/" className="flex items-center gap-3 shrink-0 group">
        <BrandMark size={30} />
        <span className="font-bold text-lg tracking-tight group-hover:text-accent transition-colors">
          AapdaMitra
        </span>
      </a>
      <div className="flex items-center gap-2.5 flex-wrap justify-end">
        <EnterAppLink role="citizen" className={pill} pendingLabel="Entering…">
          Citizen
        </EnterAppLink>
        <EnterAppLink role="authority" className={pill} pendingLabel="Entering…">
          Authority
        </EnterAppLink>
        <ThemeToggle />
      </div>
    </nav>
  );
}
