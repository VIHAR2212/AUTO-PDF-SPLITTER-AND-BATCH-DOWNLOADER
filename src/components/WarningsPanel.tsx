import type { DuplicateWarning, MissingWarning } from '@/types';
import { WarnIcon } from './icons';

interface WarningsPanelProps {
  duplicates: DuplicateWarning[];
  missing: MissingWarning[];
}

export function WarningsPanel({ duplicates, missing }: WarningsPanelProps) {
  if (duplicates.length === 0 && missing.length === 0) return null;

  return (
    <div className="card p-4 border-[#956400]/20">
      <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#956400]">
        <WarnIcon width={13} height={13} />
        Review needed
      </h3>
      <ul className="space-y-1.5 text-[13px] leading-relaxed text-ink-soft dark:text-white/70">
        {duplicates.map((d) => (
          <li key={d.number} className="flex items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[#9F2F2D]" />
            Duplicate number <strong className="font-medium text-ink dark:text-white">{d.number}</strong> found in{' '}
            {d.sectionIds.length} sections
          </li>
        ))}
        {missing.map((m, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[#956400]" />
            {m.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
