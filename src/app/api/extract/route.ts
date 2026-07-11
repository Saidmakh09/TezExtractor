import { NextResponse } from "next/server";
import { extractFromFile } from "@/lib/extractText";
import { extractLoad } from "@/lib/extractLoad";

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

    const text = await extractFromFile(await file.arrayBuffer(), file.type);
    if (text.needsVision) {
      return NextResponse.json(
        { ok: false, error: "Scanned or image document: vision path arrives in Step 6" },
        { status: 501 }
      );
    }

    const { record, usage } = await extractLoad(text.text);
    return NextResponse.json({ ok: true, name: file.name, record, usage });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
