"use client";

import { useRef, useState } from "react";

type Confidence = "high" | "medium" | "low";

type ExtractResponse = {
  ok: boolean;
  error?: string;
  name?: string;
  path?: "pdf-text" | "pdf-scan" | "image";
  record?: Record<string, string | number | null> & {
    field_confidence: Record<string, Confidence>;
  };
  validation?: { needs_review: boolean; problems: string[] };
  usage?: { input_tokens: number; output_tokens: number; cost_usd: number };
};

const FIELDS: Array<[string, string]> = [
  ["broker", "Broker"],
  ["load_number", "Load number"],
  ["pickup_location", "Pickup location"],
  ["pickup_date", "Pickup date"],
  ["pickup_window", "Pickup window"],
  ["delivery_location", "Delivery location"],
  ["delivery_date", "Delivery date"],
  ["delivery_window", "Delivery window"],
  ["miles", "Miles"],
  ["weight", "Weight (lbs)"],
  ["equipment", "Equipment"],
  ["rate", "Rate (USD)"],
];

const PATH_LABELS: Record<string, string> = {
  "pdf-text": "Text PDF",
  "pdf-scan": "Scanned PDF, read by vision",
  image: "Image, read by vision",
};

const DOT: Record<Confidence, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-400",
  low: "bg-red-500",
};

export default function Home() {
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data: ExtractResponse = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Extraction failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-8 font-sans">
      <h1 className="text-3xl font-bold tracking-tight">Tez Extractor</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Turns trucking rate confirmations into structured load records.
      </p>

      <div
        data-testid="dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`mt-8 cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          dragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {busy ? (
          <div className="flex items-center justify-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
            <span className="text-zinc-600 dark:text-zinc-300">
              Reading the document. Vision documents take up to half a minute.
            </span>
          </div>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-300">
            Drop a rate confirmation here, or click to browse. PDF or photo.
          </p>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {result?.record && (
        <section data-testid="result" className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">{result.name}</h2>
            <span className="rounded-full bg-zinc-200 px-3 py-0.5 text-xs dark:bg-zinc-800">
              {PATH_LABELS[result.path ?? ""] ?? result.path}
            </span>
            {result.validation?.needs_review ? (
              <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Needs review
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Ready
              </span>
            )}
            <span className="ml-auto text-xs text-zinc-500">
              ${result.usage?.cost_usd.toFixed(4)}
            </span>
          </div>

          {result.validation && result.validation.problems.length > 0 && (
            <ul className="mt-4 space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {result.validation.problems.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          )}

          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 rounded-xl border border-zinc-200 p-6 sm:grid-cols-2 dark:border-zinc-800">
            {FIELDS.map(([key, label]) => {
              const value = result.record?.[key];
              const confidence = result.record?.field_confidence?.[key];
              return (
                <div key={key} className="flex items-start gap-2">
                  <span
                    title={`confidence: ${confidence}`}
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${confidence ? DOT[confidence] : "bg-zinc-300"}`}
                  />
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
                    <dd className="truncate text-sm" title={String(value ?? "")}>
                      {value === null || value === undefined ? (
                        <span className="italic text-zinc-400">not found</span>
                      ) : (
                        String(value)
                      )}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </section>
      )}
    </main>
  );
}
