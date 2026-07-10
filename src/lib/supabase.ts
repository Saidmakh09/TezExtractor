import { createClient } from "@supabase/supabase-js";

// Server side only. The secret key must never reach the browser,
// so this module is imported exclusively from API routes.
export function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey || url.startsWith("PASTE_") || secretKey.startsWith("PASTE_")) {
    throw new Error("Fill in SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
  }
  return createClient(url, secretKey, { auth: { persistSession: false } });
}
