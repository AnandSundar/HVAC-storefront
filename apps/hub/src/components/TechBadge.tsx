import { cn } from '@/lib/cn';
import type { TechSkill } from '@/data/profile';

interface TechBadgeProps {
  readonly label: string;
  readonly proficiency?: TechSkill['proficiency'];
  readonly className?: string;
}

const PROFICIENCY_RING: Record<NonNullable<TechBadgeProps['proficiency']>, string> =
  {
    expert: 'ring-1 ring-primary/20',
    proficient: 'ring-1 ring-foreground/10',
    familiar: 'ring-1 ring-border',
  };

const PROFICIENCY_LABEL: Record<NonNullable<TechBadgeProps['proficiency']>, string> =
  {
    expert: 'Expert',
    proficient: 'Proficient',
    familiar: 'Familiar',
  };

export function TechBadge({
  label,
  proficiency,
  className,
}: TechBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground transition-colors',
        proficiency ? PROFICIENCY_RING[proficiency] : '',
        className,
      )}
      title={proficiency ? `${PROFICIENCY_LABEL[proficiency]} – ${label}` : label}
    >
      {label}
    </span>
  );
}
