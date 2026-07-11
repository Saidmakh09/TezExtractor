import { extractText, getDocumentProxy } from "unpdf";

// Below this many characters we assume the PDF is a scan (a picture
// wrapped in a PDF) and route it to the vision path instead.
const TEXT_LAYER_THRESHOLD = 100;

export type ExtractionResult = {
  kind: "pdf-text" | "pdf-scan" | "image";
  pages: number;
  chars: number;
  needsVision: boolean;
  text: string;
};

export async function extractFromFile(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<ExtractionResult> {
  if (mimeType.startsWith("image/")) {
    return { kind: "image", pages: 1, chars: 0, needsVision: true, text: "" };
  }
  if (mimeType !== "application/pdf") {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const cleaned = text.trim();

  if (cleaned.length < TEXT_LAYER_THRESHOLD) {
    return {
      kind: "pdf-scan",
      pages: totalPages,
      chars: cleaned.length,
      needsVision: true,
      text: "",
    };
  }
  return {
    kind: "pdf-text",
    pages: totalPages,
    chars: cleaned.length,
    needsVision: false,
    text: cleaned,
  };
}
