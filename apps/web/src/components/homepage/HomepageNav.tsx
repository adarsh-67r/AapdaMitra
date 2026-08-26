import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomepageNav() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6">
      <Link href="/" className="font-bold text-lg tracking-tight">
        AapdaMitra
      </Link>
      <ThemeToggle />
    </nav>
  );
}
