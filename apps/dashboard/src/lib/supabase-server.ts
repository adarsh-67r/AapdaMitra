import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

// Server-only client using the service role key — bypasses RLS. Never import
// this from a "use client" component or expose the key to the browser.
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Verifies the request's bearer token belongs to a signed-in user with
// profiles.role = 'authority'. Routes that use the service-role client
// (which bypasses RLS) must call this themselves — RLS alone doesn't
// protect them, since the service role ignores it entirely.
export async function requireAuthority(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer /, "");
  if (!token) return null;

  const db = supabaseServer();
  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profile?.role !== "authority") return null;
  return userData.user;
}
