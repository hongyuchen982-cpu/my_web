export default function PageLoading() {
  return (
    <div className="animate-pulse space-y-8" aria-label="Loading">
      <div className="space-y-3 border-b border-[var(--color-border)] pb-7">
        <div className="h-3 w-36 rounded bg-[var(--color-border)]" />
        <div className="h-8 w-28 rounded bg-[var(--color-border)]" />
        <div className="h-10 w-full rounded-lg bg-[var(--color-surface)]" />
      </div>
      <div className="flex gap-2">
        {[72, 88, 104, 80].map((width) => (
          <div
            key={width}
            className="h-7 rounded-full bg-[var(--color-border)]"
            style={{ width }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
    </div>
  );
}
