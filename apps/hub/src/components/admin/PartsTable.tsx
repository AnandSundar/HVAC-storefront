import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Part } from '@/lib/parts';
import { TechBadge } from '@/components/TechBadge';

interface PartsTableProps {
  readonly parts: readonly Part[];
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/**
 * Formats a Laravel decimal-cast string as `$X.XX`. Falls back to the raw
 * string when it cannot parse (defensive — the part-schema and the PHP
 * validation both guarantee a numeric value, but a stale row from older
 * data should not crash the render).
 */
function formatUnitCost(unitCost: string): string {
  const n = Number.parseFloat(unitCost);
  return Number.isFinite(n) ? currencyFormatter.format(n) : unitCost;
}

export function PartsTable({ parts }: PartsTableProps): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">SKU</th>
            <th scope="col" className="px-4 py-3">Name</th>
            <th scope="col" className="px-4 py-3">Category</th>
            <th scope="col" className="px-4 py-3 text-right">Unit cost</th>
            <th scope="col" className="px-4 py-3 text-right">Qty</th>
            <th scope="col" className="px-4 py-3">Bin</th>
            <th scope="col" className="px-4 py-3 text-right">Edit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {parts.map((part) => (
            <tr key={part.id} className="bg-background transition-colors hover:bg-secondary/30">
              <td className="px-4 py-3 font-mono text-xs">{part.part_number}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{part.name}</div>
                {part.description ? (
                  <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {part.description}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <TechBadge label={part.category} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatUnitCost(part.unit_cost)}
              </td>
              <td className={cn(
                'px-4 py-3 text-right tabular-nums',
                part.inventory_qty === 0 && 'text-destructive',
              )}>
                {part.inventory_qty.toLocaleString('en-US')}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {part.bin_location ?? <span className="italic">—</span>}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/inventory/${encodeURIComponent(part.part_number)}`}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                  aria-label={`Edit ${part.part_number}`}
                >
                  Edit
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
