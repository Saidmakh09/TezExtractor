// Accuracy eval: runs every sample through the live /api/extract pipeline
// and scores each field against the hand labeled answer key.
//
//   node scripts/eval.mjs [model]     model: claude-opus-4-8 (default) | claude-haiku-4-5
//
// Requires the server on http://localhost:3001 (override with EVAL_BASE_URL)
// and files in samples/. Set EVAL_MIN_PCT (e.g. 90) to exit nonzero when
// overall accuracy lands below that percentage; CI uses this as the gate.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const MODEL = process.argv[2] ?? "claude-opus-4-8";
const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3001";
const KEY = JSON.parse(readFileSync(new URL("./answer_key.json", import.meta.url), "utf8"));
const FIELDS = [
  "broker", "load_number", "pickup_location", "pickup_date", "pickup_window",
  "delivery_location", "delivery_date", "delivery_window", "miles", "weight",
  "equipment", "rate",
];
const NUMERIC = new Set(["miles", "weight", "rate"]);

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

function matches(expected, actual, numeric) {
  const accepted = Array.isArray(expected) ? expected : [expected];
  return accepted.some((exp) => {
    if (exp === null) return actual === null;
    if (actual === null || actual === undefined) return false;
    if (numeric) return Math.abs(Number(actual) - Number(exp)) < 0.01;
    const a = norm(actual);
    const e = norm(exp);
    return a.includes(e) || e.includes(a);
  });
}

async function runOne(file, meta) {
  const bytes = readFileSync(path.join("samples", file));
  const form = new FormData();
  form.append("file", new File([bytes], file, { type: meta.mime }));
  const res = await fetch(`${BASE}/api/extract?save=false&model=${MODEL}`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${file}: ${data.error}`);

  const fields = {};
  let correct = 0;
  for (const f of FIELDS) {
    const ok = matches(meta[f], data.record[f], NUMERIC.has(f));
    fields[f] = { ok, expected: meta[f], got: data.record[f] };
    if (ok) correct += 1;
  }
  return { file, correct, fields, cost: data.usage.cost_usd, path: data.path };
}

const files = Object.entries(KEY).filter(([k]) => !k.startsWith("_"));
const results = [];
const POOL = 3;
for (let i = 0; i < files.length; i += POOL) {
  const batch = files.slice(i, i + POOL);
  const settled = await Promise.all(batch.map(([file, meta]) => runOne(file, meta)));
  results.push(...settled);
  console.log(`  ${Math.min(i + POOL, files.length)}/${files.length} documents scored`);
}

const perField = {};
for (const f of FIELDS) {
  const ok = results.filter((r) => r.fields[f].ok).length;
  perField[f] = { correct: ok, total: results.length };
}
const totalCells = results.length * FIELDS.length;
const totalCorrect = results.reduce((s, r) => s + r.correct, 0);
const totalCost = results.reduce((s, r) => s + r.cost, 0);

console.log(`\n=== ${MODEL} ===`);
console.log(`Overall: ${totalCorrect}/${totalCells} fields (${((totalCorrect / totalCells) * 100).toFixed(1)}%)`);
console.log(`Total cost: $${totalCost.toFixed(4)}\n`);
console.log("Per field:");
for (const f of FIELDS) {
  const { correct, total } = perField[f];
  console.log(`  ${f.padEnd(18)} ${correct}/${total}`);
}
console.log("\nPer document:");
for (const r of results) {
  const misses = FIELDS.filter((f) => !r.fields[f].ok);
  console.log(`  ${String(r.correct).padStart(2)}/12  ${r.file}${misses.length ? `  missed: ${misses.join(", ")}` : ""}`);
}

writeFileSync(
  new URL(`./eval_results_${MODEL}.json`, import.meta.url),
  JSON.stringify({ model: MODEL, overall: { correct: totalCorrect, total: totalCells }, perField, totalCost, results }, null, 2)
);
console.log(`\nSaved scripts/eval_results_${MODEL}.json`);

if (process.env.EVAL_MIN_PCT) {
  const minPct = Number(process.env.EVAL_MIN_PCT);
  const pct = (totalCorrect / totalCells) * 100;
  if (!Number.isFinite(minPct)) {
    console.error(`EVAL_MIN_PCT is not a number: ${process.env.EVAL_MIN_PCT}`);
    process.exit(1);
  }
  if (pct < minPct) {
    console.error(`\nFAIL: overall accuracy ${pct.toFixed(1)}% is below the ${minPct}% floor`);
    process.exit(1);
  }
  console.log(`\nPASS: overall accuracy ${pct.toFixed(1)}% meets the ${minPct}% floor`);
}
