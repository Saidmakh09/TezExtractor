"use client";

import { useEffect, useState } from "react";

type Load = {
  id: string;
  created_at: string;
  source_file: string | null;
  broker: string | null;
  load_number: string | null;
  pickup_location: string | null;
  pickup_date: string | null;
  pickup_window: string | null;
  delivery_location: string | null;
  delivery_date: string | null;
  delivery_window: string | null;
  miles: number | null;
  weight: number | null;
  equipment: string | null;
  rate: number | null;
  status: string;
  needs_review: boolean;
};

const EDIT_FIELDS: Array<[keyof Load, string]> = [
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

function StatusBadge({ load }: { load: Load }) {
  if (load.status === "approved") {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        Approved
      </span>
    );
  }
  if (load.needs_review) {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        Needs review
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs dark:bg-zinc-800">
      Extracted
    </span>
  );
}

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [selected, setSelected] = useState<Load | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/loads");
    const data = await res.json();
    if (data.ok) setLoads(data.loads);
    else setError(data.error);
  }

  useEffect(() => {
    refresh();
  }, []);

  function select(load: Load) {
    setSelected(load);
    const d: Record<string, string> = {};
    for (const [key] of EDIT_FIELDS) d[key] = load[key] === null ? "" : String(load[key]);
    setDraft(d);
  }

  async function save(extra: Record<string, unknown> = {}) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/loads/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, ...extra }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSelected(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loads</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Every extracted rate confirmation, newest first.
          </p>
        </div>
        <a href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Upload another document
        </a>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Broker</th>
              <th className="px-4 py-3">Load</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Pickup</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  Nothing here yet. Upload a rate confirmation to create the first load.
                </td>
              </tr>
            )}
            {loads.map((load) => (
              <tr
                key={load.id}
                data-testid="load-row"
                onClick={() => select(load)}
                className={`cursor-pointer border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                  selected?.id === load.id ? "bg-blue-50 dark:bg-blue-950" : ""
                }`}
              >
                <td className="px-4 py-3">{load.broker ?? <i className="text-zinc-400">unknown</i>}</td>
                <td className="px-4 py-3">{load.load_number ?? ""}</td>
                <td className="max-w-56 truncate px-4 py-3" title={`${load.pickup_location ?? "?"} to ${load.delivery_location ?? "?"}`}>
                  {(load.pickup_location ?? "?").split(",").slice(-2).join(",")} to{" "}
                  {(load.delivery_location ?? "?").split(",").slice(-2).join(",")}
                </td>
                <td className="px-4 py-3">{load.pickup_date ?? ""}</td>
                <td className="px-4 py-3">{load.rate !== null ? `$${load.rate}` : ""}</td>
                <td className="px-4 py-3">
                  <StatusBadge load={load} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <section
          data-testid="editor"
          className="mt-6 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Review: {selected.source_file ?? selected.id}
            </h2>
            <StatusBadge load={selected} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EDIT_FIELDS.map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
                <input
                  value={draft[key] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
                />
              </label>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => save({ status: "approved", needs_review: false })}
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving" : "Save and approve"}
            </button>
            <button
              onClick={() => save()}
              disabled={saving}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Save changes
            </button>
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:underline"
            >
              Close
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
