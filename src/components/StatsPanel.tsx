import type { ProcessingStats } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function StatsPanel({ stats }: { stats: ProcessingStats }) {
  const items = [
    { label: 'Total pages', value: stats.totalPages.toString() },
    { label: 'Detected sections', value: stats.detectedSections.toString() },
    { label: 'Output size', value: stats.outputSizeBytes ? formatBytes(stats.outputSizeBytes) : '—' },
    { label: 'Processing time', value: formatDuration(stats.processingTimeMs) },
  ];

  return (
    <div className="card p-4">
      <h3 className="mb-3.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[11px] text-ink-muted">{item.label}</p>
            <p className="font-serif text-2xl text-ink dark:text-white tracking-tight">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
