"use client";

import CitizenWebView from "@/components/CitizenWebView";
import DashboardShell from "@/components/DashboardShell";
import Homepage from "@/components/homepage/Homepage";
import { useAuth } from "@/lib/use-auth";

export default function Home() {
  const { status, signOut } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-bg text-text-muted text-sm">
        Loading…
      </div>
    );
  }

  if (status === "signed-out") {
    return <Homepage />;
  }

  if (status === "citizen") {
    return <CitizenWebView onSignOut={signOut} />;
  }

  return <DashboardShell onSignOut={signOut} />;
}
