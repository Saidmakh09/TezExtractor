import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// Health check: proves the app can reach the database and see the loads table.
export async function GET() {
  try {
    const supabase = supabaseServer();
    const { count, error } = await supabase
      .from("loads")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ ok: true, loadsInDatabase: count ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
