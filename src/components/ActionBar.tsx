import type { ExportFormat } from '@/types';
import { DownloadIcon, SearchIcon, UndoIcon, RedoIcon, PlusIcon } from './icons';

interface ActionBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  exportFormat: ExportFormat;
  onExportFormatChange: (f: ExportFormat) => void;
  onExport: () => void;
  exporting: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddManual: () => void;
  sectionCount: number;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'zip', label: 'PDF · ZIP' },
  { value: 'individual', label: 'PDF · Individual' },
  { value: 'docx-zip', label: 'DOCX · ZIP' },
  { value: 'docx-individual', label: 'DOCX · Individual' },
];

export function ActionBar({
  search,
  onSearchChange,
  exportFormat,
  onExportFormatChange,
  onExport,
  exporting,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddManual,
  sectionCount,
}: ActionBarProps) {
  return (
    <div className="card sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-card px-3 py-2.5">
      <div className="relative flex-1 min-w-[160px]">
        <SearchIcon width={13} height={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search experiments..."
          className="input-field pl-8 py-1.5"
        />
      </div>

      <button className="btn-ghost" onClick={onAddManual} title="Add custom section">
        <PlusIcon width={13} height={13} /> Add
      </button>

      <div className="flex items-center gap-0.5">
        <button className="btn-ghost" disabled={!canUndo} onClick={onUndo} title="Undo">
          <UndoIcon width={14} height={14} />
        </button>
        <button className="btn-ghost" disabled={!canRedo} onClick={onRedo} title="Redo">
          <RedoIcon width={14} height={14} />
        </button>
      </div>

      <select
        value={exportFormat}
        onChange={(e) => onExportFormatChange(e.target.value as ExportFormat)}
        className="select-field !w-auto py-1.5 text-xs"
      >
        {FORMAT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button className="btn-primary" onClick={onExport} disabled={exporting || sectionCount === 0}>
        <DownloadIcon width={14} height={14} />
        {exporting ? 'Exporting...' : `Export ${sectionCount} file${sectionCount === 1 ? '' : 's'}`}
      </button>
    </div>
  );
}
