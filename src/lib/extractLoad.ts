import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { LoadRecordSchema, type LoadRecord } from "./loadRecord";

const MODEL = "claude-opus-4-8";
// Pricing per million tokens, for the usage report we return with each call.
const INPUT_PRICE_PER_MTOK = 5.0;
const OUTPUT_PRICE_PER_MTOK = 25.0;

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

export async function extractLoad(
  documentText: string
): Promise<{ record: LoadRecord; usage: ExtractionUsage }> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract the load record from this rate confirmation:\n\n${documentText}`,
      },
    ],
    output_config: { format: zodOutputFormat(LoadRecordSchema) },
  });

  if (!response.parsed_output) {
    throw new Error(`Extraction returned no parsable record (stop_reason: ${response.stop_reason})`);
  }

  const cost =
    (response.usage.input_tokens * INPUT_PRICE_PER_MTOK) / 1_000_000 +
    (response.usage.output_tokens * OUTPUT_PRICE_PER_MTOK) / 1_000_000;

  return {
    record: response.parsed_output,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cost_usd: Number(cost.toFixed(4)),
    },
  };
}
