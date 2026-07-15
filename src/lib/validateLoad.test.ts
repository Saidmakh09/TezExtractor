import { describe, expect, it } from "vitest";
import type { LoadRecord } from "./loadRecord";
import { validateLoad } from "./validateLoad";

// A fully populated, clearly stated record that should pass untouched.
function cleanRecord(overrides: Partial<LoadRecord> = {}): LoadRecord {
  return {
    broker: "Integrity Express Logistics",
    load_number: "1971493",
    pickup_location: "Tyson Foods, Goodlettsville, TN",
    pickup_date: "2023-09-18",
    pickup_window: "FCFS 0800-1500",
    delivery_location: "Kroger DC, Louisville, KY",
    delivery_date: "2023-09-19",
    delivery_window: "APPT 0600",
    miles: 175,
    weight: 42000,
    equipment: "Van 53 ft",
    rate: 850,
    field_confidence: {
      broker: "high",
      load_number: "high",
      pickup_location: "high",
      pickup_date: "high",
      pickup_window: "high",
      delivery_location: "high",
      delivery_date: "high",
      delivery_window: "high",
      miles: "high",
      weight: "high",
      equipment: "high",
      rate: "high",
    },
    ...overrides,
  };
}

describe("validateLoad", () => {
  it("passes a clean record with no problems", () => {
    const result = validateLoad(cleanRecord());
    expect(result.needs_review).toBe(false);
    expect(result.problems).toEqual([]);
  });

  const required = [
    "broker",
    "load_number",
    "pickup_location",
    "pickup_date",
    "delivery_location",
    "rate",
  ] as const;

  it.each(required)("flags missing required field: %s", (field) => {
    const result = validateLoad(cleanRecord({ [field]: null }));
    expect(result.needs_review).toBe(true);
    expect(result.problems).toContain(`missing required field: ${field}`);
  });

  const optional = [
    "pickup_window",
    "delivery_date",
    "delivery_window",
    "miles",
    "weight",
    "equipment",
  ] as const;

  it.each(optional)("allows null optional field: %s", (field) => {
    const result = validateLoad(cleanRecord({ [field]: null }));
    expect(result.needs_review).toBe(false);
  });

  it("rejects a pickup_date that is not ISO formatted", () => {
    const result = validateLoad(cleanRecord({ pickup_date: "09/18/2023" }));
    expect(result.needs_review).toBe(true);
    expect(result.problems).toContain("pickup_date is not a valid date: 09/18/2023");
  });

  it("rejects an ISO shaped date that does not exist", () => {
    const result = validateLoad(cleanRecord({ delivery_date: "2023-02-30" }));
    expect(result.needs_review).toBe(true);
    expect(result.problems).toContain("delivery_date is not a valid date: 2023-02-30");
  });

  it("rejects delivery before pickup", () => {
    const result = validateLoad(
      cleanRecord({ pickup_date: "2023-09-19", delivery_date: "2023-09-18" })
    );
    expect(result.needs_review).toBe(true);
    expect(result.problems).toContain(
      "delivery_date 2023-09-18 is before pickup_date 2023-09-19"
    );
  });

  it("allows same day pickup and delivery", () => {
    const result = validateLoad(
      cleanRecord({ pickup_date: "2023-09-18", delivery_date: "2023-09-18" })
    );
    expect(result.needs_review).toBe(false);
  });

  it.each([
    ["rate", 0],
    ["rate", -100],
    ["rate", 100_001],
    ["miles", 0],
    ["miles", 6_001],
    ["weight", 0],
    ["weight", 60_001],
  ] as const)("rejects %s out of sane range: %d", (field, value) => {
    const result = validateLoad(cleanRecord({ [field]: value }));
    expect(result.needs_review).toBe(true);
    expect(result.problems.some((p) => p.startsWith(`${field} out of sane range`))).toBe(true);
  });

  it.each([
    ["rate", 100_000],
    ["miles", 6_000],
    ["weight", 60_000],
  ] as const)("accepts %s at the upper boundary: %d", (field, value) => {
    const result = validateLoad(cleanRecord({ [field]: value }));
    expect(result.needs_review).toBe(false);
  });

  it("flags every low confidence field by name", () => {
    const record = cleanRecord();
    record.field_confidence.weight = "low";
    record.field_confidence.equipment = "low";
    const result = validateLoad(record);
    expect(result.needs_review).toBe(true);
    expect(result.problems).toContain("low confidence: weight, equipment");
  });

  it("does not flag medium confidence", () => {
    const record = cleanRecord();
    record.field_confidence.weight = "medium";
    const result = validateLoad(record);
    expect(result.needs_review).toBe(false);
  });

  it("accumulates multiple problems in one pass", () => {
    const record = cleanRecord({ broker: null, rate: -5, pickup_date: "tomorrow" });
    record.field_confidence.miles = "low";
    const result = validateLoad(record);
    expect(result.needs_review).toBe(true);
    expect(result.problems).toHaveLength(4);
  });
});
