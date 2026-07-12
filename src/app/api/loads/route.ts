import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// List saved loads, newest first, for the review dashboard.
export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("loads")
      .select(
        "id, created_at, source_file, broker, load_number, pickup_location, pickup_date, pickup_window, delivery_location, delivery_date, delivery_window, miles, weight, equipment, rate, status, needs_review, field_confidence"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ ok: true, loads: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
