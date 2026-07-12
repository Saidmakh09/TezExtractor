import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { LoadRecordSchema, type LoadRecord } from "./loadRecord";

// Pricing per million tokens (input, output), for the usage report.
export const MODELS = {
  "claude-opus-4-8": { input: 5.0, output: 25.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
} as const;
export type ModelId = keyof typeof MODELS;
const DEFAULT_MODEL: ModelId = "claude-opus-4-8";

const SYSTEM_PROMPT = `You extract structured load records from trucking rate confirmations.

A rate confirmation is the contract between a freight broker and a carrier for one load. Different brokers use completely different layouts, but the same facts are always in there somewhere: who the broker is, the load or PO number, where and when to pick up, where and when to deliver, the equipment required, and the rate.

Rules:
- Extract only what the document states. Never invent values. Use null for anything absent.
- Normalize dates to YYYY-MM-DD. Documents often write 09/20/23; that is 2023-09-20.
- Keep time windows as written (for example "FCFS 1200-1530" or "0830 Appt").
- The rate is the total to the carrier, not per mile.
- For each field, rate your confidence: high if clearly stated, medium if you had to infer it, low if it is unclear.`;

export type ExtractionUsage = {
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
};

// The document arrives in one of three forms: extracted text, a photo or
// screenshot, or a scanned PDF that Claude reads visually page by page.
export type ExtractInput =
  | { kind: "text"; text: string }
  | { kind: "image"; base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" }
  | { kind: "pdf"; base64: string };

const INSTRUCTION = "Extract the load record from this rate confirmation:";

function buildContent(input: ExtractInput): Anthropic.ContentBlockParam[] {
  if (input.kind === "text") {
    return [{ type: "text", text: `${INSTRUCTION}\n\n${input.text}` }];
  }
  if (input.kind === "image") {
    return [
      { type: "image", source: { type: "base64", media_type: input.mediaType, data: input.base64 } },
      { type: "text", text: INSTRUCTION },
    ];
  }
  return [
    { type: "document", source: { type: "base64", media_type: "application/pdf", data: input.base64 } },
    { type: "text", text: INSTRUCTION },
  ];
}

export async function extractLoad(
  input: ExtractInput,
  model: ModelId = DEFAULT_MODEL
): Promise<{ record: LoadRecord; usage: ExtractionUsage }> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model,
    max_tokens: 4000,
    // Adaptive thinking exists on Opus; Haiku 4.5 runs without thinking.
    ...(model === "claude-opus-4-8" ? { thinking: { type: "adaptive" as const } } : {}),
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildContent(input) }],
    output_config: { format: zodOutputFormat(LoadRecordSchema) },
  });

  if (!response.parsed_output) {
    throw new Error(`Extraction returned no parsable record (stop_reason: ${response.stop_reason})`);
  }

  const price = MODELS[model];
  const cost =
    (response.usage.input_tokens * price.input) / 1_000_000 +
    (response.usage.output_tokens * price.output) / 1_000_000;

  return {
    record: response.parsed_output,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cost_usd: Number(cost.toFixed(4)),
    },
  };
}
