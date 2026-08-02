import type { AppSettings, SectionCategory } from '@/types';
import { previewFilename } from '@/lib/naming/namingEngine';

interface NamingBuilderProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
}

const CATEGORIES: SectionCategory[] = [
  'Experiment',
  'Assignment',
  'Practical',
  'Chapter',
  'Unit',
  'Section',
  'Viva',
  'Custom',
];

const QUICK_TEMPLATES = [
  '{Category} {Number} {Roll}',
  '{Prefix}{Category}-{Number}{Suffix}',
  'EXP-{Number}-{Roll}',
  '{Roll}_{Category}_{Number}',
];

export function NamingBuilder({ settings, onChange }: NamingBuilderProps) {
  const preview = previewFilename(settings.namingTemplate, {
    category: settings.category,
    number: '1',
    prefix: settings.prefix,
    rollNumber: settings.rollNumber,
    suffix: settings.suffix,
  });

  return (
    <div className="card p-4 space-y-3.5">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Naming builder</h3>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-xs text-ink-muted">Category</label>
          <select
            className="select-field mt-1"
            value={settings.category}
            onChange={(e) => onChange({ category: e.target.value as SectionCategory })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink-muted">Roll number</label>
          <input
            className="input-field mt-1"
            placeholder="e.g. 30"
            value={settings.rollNumber}
            onChange={(e) => onChange({ rollNumber: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-ink-muted">Prefix</label>
          <input
            className="input-field mt-1"
            placeholder="optional"
            value={settings.prefix}
            onChange={(e) => onChange({ prefix: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-ink-muted">Suffix</label>
          <input
            className="input-field mt-1"
            placeholder="optional"
            value={settings.suffix}
            onChange={(e) => onChange({ suffix: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-ink-muted">Naming template</label>
        <input
          className="input-field mt-1 font-mono text-xs"
          value={settings.namingTemplate}
          onChange={(e) => onChange({ namingTemplate: e.target.value })}
          placeholder="{Category} {Number} {Roll}"
        />
        <div className="mt-1.5 flex flex-wrap gap-1">
          {QUICK_TEMPLATES.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ namingTemplate: t })}
              className="tag tag-neutral font-mono normal-case tracking-normal hover:brightness-95 transition-[filter]"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-control border border-line dark:border-white/10 bg-bone-100 dark:bg-white/5 px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-wider text-ink-muted">Preview</p>
        <p className="font-mono text-sm text-ink dark:text-white truncate mt-0.5">{preview}.pdf</p>
      </div>
    </div>
  );
}
