import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import EnterAppLink from "./EnterAppLink";

const pill =
"font-mono text-xs px-4 py-2 min-h-9 inline-flex items-center rounded-full bg-panel border border-border hover:bg-panel-alt transition-colors";

export default function HomepageNav() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 gap-4">
      <Link href="/" className="font-bold text-lg tracking-tight shrink-0">
        AapdaMitra
      </Link>
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
