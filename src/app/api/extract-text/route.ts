import { NextResponse } from "next/server";
import { extractFromFile } from "@/lib/extractText";

// Accepts an uploaded rate confirmation (PDF or image) and returns its raw
// text, or flags it for the vision path when there is no text to extract.
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

    const result = await extractFromFile(await file.arrayBuffer(), file.type);
    return NextResponse.json({
      ok: true,
      name: file.name,
      ...result,
      textPreview: result.text.slice(0, 300),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
