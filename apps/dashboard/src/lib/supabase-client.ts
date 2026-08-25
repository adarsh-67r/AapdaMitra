import { createClient } from "@supabase/supabase-js";

// Browser-side client — safe to expose, RLS policies gate what it can read/write.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
