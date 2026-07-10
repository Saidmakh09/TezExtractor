export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold tracking-tight">Tez Extractor</h1>
      <p className="max-w-md text-center text-lg text-zinc-600 dark:text-zinc-300">
        Turns trucking rate confirmations into structured load records.
      </p>
      <div className="rounded-lg border border-zinc-300 px-6 py-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Step 2 complete: app scaffold running. Next up: the loads database.
      </div>
    </main>
  );
}
