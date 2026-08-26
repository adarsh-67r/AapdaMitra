export default function HomepageNav() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6">
      <span className="font-bold text-lg tracking-tight">AapdaMitra</span>
      <div className="hidden sm:flex gap-6 font-mono text-xs text-text-muted">
        <a href="#problem" className="hover:text-text transition-colors">
          The Problem
        </a>
        <a href="#how-it-works" className="hover:text-text transition-colors">
          How it works
        </a>
        <a href="#features" className="hover:text-text transition-colors">
          What it does
        </a>
      </div>
    </nav>
  );
}
