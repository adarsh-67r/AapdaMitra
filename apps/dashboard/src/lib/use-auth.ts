"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

export type Role = "citizen" | "authority";
export type AuthStatus = "loading" | "signed-out" | Role;

export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session?.user) {
      setStatus("signed-out");
      return;
    }

    (async () => {
      const { data: existing } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (existing) {
        setStatus(existing.role as Role);
        return;
      }

      const intended = (localStorage.getItem("intended_role") as Role | null) ?? "citizen";
      localStorage.removeItem("intended_role");
      const { error } = await supabase.from("profiles").insert({ id: session.user.id, role: intended });
      if (error) console.warn("profile insert failed:", error.message);
      setStatus(intended);
    })();
  }, [session]);

  const signOut = () => supabase.auth.signOut();

  return { status, session, signOut };
}
