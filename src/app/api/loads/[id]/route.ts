import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// Fields a reviewer may change. Everything else (id, timestamps, provenance)
// is locked; the update is a whitelist, never a passthrough of request JSON.
const EDITABLE_TEXT = [
  "broker",
  "load_number",
  "pickup_location",
  "pickup_date",
  "pickup_window",
  "delivery_location",
  "delivery_date",
  "delivery_window",
  "equipment",
  "status",
] as const;
const EDITABLE_NUMBER = ["miles", "weight", "rate"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const update: Record<string, string | number | boolean | null> = {};
    for (const key of EDITABLE_TEXT) {
      if (key in body) update[key] = body[key] === "" ? null : String(body[key]);
    }
    for (const key of EDITABLE_NUMBER) {
      if (key in body) {
        const n = Number(body[key]);
        update[key] = body[key] === "" || body[key] === null || Number.isNaN(n) ? null : n;
      }
    }
    if ("needs_review" in body) update.needs_review = Boolean(body.needs_review);
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: false, error: "No editable fields in request" }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("loads")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, load: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
