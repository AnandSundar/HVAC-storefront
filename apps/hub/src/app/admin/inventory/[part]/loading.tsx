/**
 * Skeleton fallback for the edit page. Shown while the part fetch + lookup
 * is in flight. Mirrors the form layout shipped in U4 so the page doesn't
 * reflow when the real form arrives.
 */
export default function AdminPartEditLoading(): React.ReactElement {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="container mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10"
    >
      <div className="flex flex-col gap-2">
        <div className="h-7 w-32 animate-pulse rounded-md bg-secondary" />
        <div className="h-4 w-80 animate-pulse rounded-md bg-secondary" />
      </div>
      <div className="flex flex-col gap-4 rounded-md border border-border bg-background p-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
            <div className="h-9 w-full animate-pulse rounded-md bg-secondary" />
          </div>
        ))}
        <div className="mt-2 h-10 w-32 animate-pulse rounded-md bg-secondary" />
      </div>
    </section>
  );
}
