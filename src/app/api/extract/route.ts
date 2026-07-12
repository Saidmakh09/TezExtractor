import { NextResponse } from "next/server";
import { extractFromFile } from "@/lib/extractText";
import { extractLoad } from "@/lib/extractLoad";
import { validateLoad } from "@/lib/validateLoad";
import { supabaseServer } from "@/lib/supabase";

// Postgres rejects malformed dates outright, so anything that is not a real
// ISO date is stored as null (validation has already flagged it for review).
function safeDate(value: string | null): string | null {
  if (value === null) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? value : null;
}

// Full pipeline: uploaded rate confirmation in, structured load record out.
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Upload a file in the 'file' form field" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    // Encode before text extraction: the PDF parser transfers the buffer to a
    // worker and detaches it, so it cannot be read again afterward.
    const base64 = Buffer.from(new Uint8Array(buffer)).toString("base64");
    const extracted = await extractFromFile(buffer, file.type);

    let input;
    if (extracted.kind === "image") {
      input = {
        kind: "image" as const,
        base64,
        mediaType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
      };
    } else if (extracted.kind === "pdf-scan") {
      input = { kind: "pdf" as const, base64 };
    } else {
      input = { kind: "text" as const, text: extracted.text };
    }

    const { record, usage } = await extractLoad(input);
    const validation = validateLoad(record);

    const supabase = supabaseServer();
    const { data: saved, error: dbError } = await supabase
      .from("loads")
      .insert({
        broker: record.broker,
        load_number: record.load_number,
        pickup_location: record.pickup_location,
        pickup_date: safeDate(record.pickup_date),
        pickup_window: record.pickup_window,
        delivery_location: record.delivery_location,
        delivery_date: safeDate(record.delivery_date),
        delivery_window: record.delivery_window,
        miles: record.miles,
        weight: record.weight,
        equipment: record.equipment,
        rate: record.rate,
        status: "extracted",
        needs_review: validation.needs_review,
        field_confidence: record.field_confidence,
        raw_text: input.kind === "text" ? input.text : null,
        source_file: file.name,
      })
      .select("id")
      .single();
    if (dbError) throw new Error(`Database insert failed: ${dbError.message}`);

    return NextResponse.json({
      ok: true,
      id: saved.id,
      name: file.name,
      path: extracted.kind,
      record,
      validation,
      usage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
