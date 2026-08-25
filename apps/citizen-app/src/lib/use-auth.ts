import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Tracks the current auth session and makes sure a `profiles` row (role =
// 'citizen') exists for it. Report inserts use session.user.id as
// citizen_id, and the RLS policies key "my reports" off auth.uid(), so this
// is the one piece of state the rest of the app depends on.
export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = still loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from("profiles")
      .upsert({ id: session.user.id, role: "citizen" }, { onConflict: "id", ignoreDuplicates: true })
      .then(({ error }) => {
        if (error) console.warn("profile upsert failed:", error.message);
      });
  }, [session?.user?.id]);

  return { session, loading: session === undefined };
}
