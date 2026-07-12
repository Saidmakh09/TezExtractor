import { NextResponse } from "next/server";
import { extractFromFile } from "@/lib/extractText";
import { extractLoad } from "@/lib/extractLoad";
import { validateLoad } from "@/lib/validateLoad";

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
    return NextResponse.json({ ok: true, name: file.name, path: extracted.kind, record, validation, usage });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
