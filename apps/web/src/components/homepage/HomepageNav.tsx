import Link from "next/link";

export default function HomepageNav() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6">
      <span className="font-bold text-lg tracking-tight">AapdaMitra</span>
      <Link
        href="/login"
        className="font-mono text-xs px-5 py-2.5 min-h-11 inline-flex items-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors"
      >
        Sign In
      </Link>
    </nav>
  );
}
