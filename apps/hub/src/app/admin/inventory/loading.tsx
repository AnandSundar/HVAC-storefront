/**
 * Skeleton fallback for the inventory list. Mirrors the column structure of
 * `<PartsTable>` so the page doesn't reflow when the real table arrives.
 */
export default function AdminInventoryLoading(): React.ReactElement {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="container mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10"
    >
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-40 animate-pulse rounded-md bg-secondary" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-secondary" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-md bg-secondary" />
      </header>

      <div className="overflow-hidden rounded-md border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              {['SKU', 'Name', 'Category', 'Unit cost', 'Qty', 'Bin', 'Edit'].map((label) => (
                <th key={label} scope="col" className="px-4 py-3">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 6 }, (_, i) => (
              <tr key={i} aria-hidden="true">
                {Array.from({ length: 7 }, (_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 w-full max-w-[8rem] animate-pulse rounded bg-secondary" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
