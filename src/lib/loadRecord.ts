import { z } from "zod";

// The structured load record we extract from every rate confirmation.
// Fields are nullable because real documents are messy: a photo of an email
// may not show the weight, and FCFS pickups have a window but no appointment.
const confidence = z.enum(["high", "medium", "low"]);

export const LoadRecordSchema = z.object({
  broker: z.string().nullable().describe("Brokerage company name, e.g. Integrity Express Logistics"),
  load_number: z.string().nullable().describe("Broker's load, order, or PO number for this load"),
  pickup_location: z.string().nullable().describe("Pickup facility name, city, and state"),
  pickup_date: z.string().nullable().describe("Pickup date in YYYY-MM-DD format"),
  pickup_window: z.string().nullable().describe("Pickup time or window as written, e.g. FCFS 1200-1530"),
  delivery_location: z.string().nullable().describe("Delivery facility name, city, and state"),
  delivery_date: z.string().nullable().describe("Delivery date in YYYY-MM-DD format"),
  delivery_window: z.string().nullable().describe("Delivery time or appointment as written"),
  miles: z.number().nullable().describe("Trip miles if stated"),
  weight: z.number().nullable().describe("Load weight in pounds if stated"),
  equipment: z.string().nullable().describe("Trailer type and size, e.g. Van 53 ft DRY"),
  rate: z.number().nullable().describe("Total rate to the carrier in USD"),
  field_confidence: z
    .object({
      broker: confidence,
      load_number: confidence,
      pickup_location: confidence,
      pickup_date: confidence,
      pickup_window: confidence,
      delivery_location: confidence,
      delivery_date: confidence,
      delivery_window: confidence,
      miles: confidence,
      weight: confidence,
      equipment: confidence,
      rate: confidence,
    })
    .describe("Per field confidence: high if clearly stated, medium if inferred, low if guessed or absent"),
});

export type LoadRecord = z.infer<typeof LoadRecordSchema>;
