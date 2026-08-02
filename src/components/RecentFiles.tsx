import type { RecentFileEntry } from '@/types';
import { FileIcon, ClockIcon } from './icons';

interface RecentFilesProps {
  files: RecentFileEntry[];
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function RecentFiles({ files }: RecentFilesProps) {
  if (files.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2.5 p-10 text-center">
        <ClockIcon width={20} height={20} className="text-ink-faint" />
        <p className="text-xs text-ink-muted">No recent files yet</p>
      </div>
    );
  }

  return (
    <div className="card divide-y divide-line dark:divide-white/10 overflow-hidden">
      {files.map((f) => (
        <div key={f.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-bone-100 dark:hover:bg-white/5 transition-colors">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[6px] bg-bone-100 dark:bg-white/5 text-ink-muted">
            <FileIcon width={15} height={15} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink dark:text-white">{f.fileName}</p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              {f.sectionCount} sections · {f.totalPages} pages · {timeAgo(f.importedAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
