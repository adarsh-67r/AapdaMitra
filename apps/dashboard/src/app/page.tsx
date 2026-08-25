"use client";

import CitizenWebView from "@/components/CitizenWebView";
import DashboardShell from "@/components/DashboardShell";
import LoginScreen from "@/components/LoginScreen";
import { useAuth } from "@/lib/use-auth";

export default function Home() {
  const { status, session, signOut } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-bg text-text-muted text-sm">
        Loading…
      </div>
    );
  }

  if (status === "signed-out" || !session) {
    return <LoginScreen />;
  }

  if (status === "citizen") {
    return <CitizenWebView session={session} onSignOut={signOut} />;
  }

  return <DashboardShell onSignOut={signOut} />;
}
