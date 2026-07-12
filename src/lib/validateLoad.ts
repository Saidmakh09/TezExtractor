import type { LoadRecord } from "./loadRecord";

// Deterministic checks on every extracted record. The model rates its own
// confidence, but code decides what enters the database unflagged. Anything
// failing here gets needs_review = true and a human looks before approval.
export type ValidationResult = {
  needs_review: boolean;
  problems: string[];
};

const REQUIRED_FIELDS = [
  "broker",
  "load_number",
  "pickup_location",
  "pickup_date",
  "delivery_location",
  "rate",
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  return ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));
}

export function validateLoad(record: LoadRecord): ValidationResult {
  const problems: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (record[field] === null) {
      problems.push(`missing required field: ${field}`);
    }
  }

  if (record.pickup_date !== null && !isValidDate(record.pickup_date)) {
    problems.push(`pickup_date is not a valid date: ${record.pickup_date}`);
  }
  if (record.delivery_date !== null && !isValidDate(record.delivery_date)) {
    problems.push(`delivery_date is not a valid date: ${record.delivery_date}`);
  }
  if (
    record.pickup_date !== null &&
    record.delivery_date !== null &&
    isValidDate(record.pickup_date) &&
    isValidDate(record.delivery_date) &&
    record.delivery_date < record.pickup_date
  ) {
    problems.push(`delivery_date ${record.delivery_date} is before pickup_date ${record.pickup_date}`);
  }

  if (record.rate !== null && (record.rate <= 0 || record.rate > 100_000)) {
    problems.push(`rate out of sane range: ${record.rate}`);
  }
  if (record.miles !== null && (record.miles <= 0 || record.miles > 6_000)) {
    problems.push(`miles out of sane range: ${record.miles}`);
  }
  if (record.weight !== null && (record.weight <= 0 || record.weight > 60_000)) {
    problems.push(`weight out of sane range: ${record.weight}`);
  }

  const lowConfidence = Object.entries(record.field_confidence)
    .filter(([, level]) => level === "low")
    .map(([field]) => field);
  if (lowConfidence.length > 0) {
    problems.push(`low confidence: ${lowConfidence.join(", ")}`);
  }

  return { needs_review: problems.length > 0, problems };
}
