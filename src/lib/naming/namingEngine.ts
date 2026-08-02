import type { AppSettings, DetectedSection } from '@/types';

export interface NamingContext {
  section: DetectedSection;
  settings: Pick<AppSettings, 'namingTemplate' | 'category' | 'prefix' | 'rollNumber' | 'suffix'>;
}

const TOKEN_PATTERN = /\{(Category|Number|Roll|Prefix|Suffix|Title|Pages)\}/g;

/**
 * Renders a naming template like "{Prefix}{Category} {Number} {Roll}{Suffix}"
 * into a final filename (without extension). Unknown tokens are left as-is
 * so users can see a typo in their template rather than silently losing text.
 */
export function renderFilename(ctx: NamingContext): string {
  const { section, settings } = ctx;
  const values: Record<string, string> = {
    Category: section.category || settings.category,
    Number: section.number,
    Roll: settings.rollNumber,
    Prefix: settings.prefix,
    Suffix: settings.suffix,
    Title: section.title,
    Pages: `p${section.startPage}-${section.endPage}`,
  };

  let rendered = settings.namingTemplate.replace(TOKEN_PATTERN, (_match, token: string) => {
    return values[token] ?? '';
  });

  // Collapse accidental double spaces from empty tokens (e.g. no roll number set)
  rendered = rendered.replace(/\s+/g, ' ').trim();

  return sanitizeFilename(rendered || section.title);
}

const ILLEGAL_FS_CHARS = /[\\/:*?"<>|]/g;

export function sanitizeFilename(name: string): string {
  return name.replace(ILLEGAL_FS_CHARS, '-').trim() || 'Untitled';
}

export function previewFilename(template: string, sample: Partial<NamingContext['settings']> & { category?: string; number?: string; title?: string }): string {
  const fakeSection: DetectedSection = {
    id: 'preview',
    category: sample.category ?? 'Experiment',
    number: sample.number ?? '1',
    title: sample.title ?? `${sample.category ?? 'Experiment'} ${sample.number ?? '1'}`,
    startPage: 1,
    endPage: 5,
    source: 'manual',
    matchedText: '',
    confidence: 1,
  };
  return renderFilename({
    section: fakeSection,
    settings: {
      namingTemplate: template,
      category: (sample.category as AppSettings['category']) ?? 'Experiment',
      prefix: sample.prefix ?? '',
      rollNumber: sample.rollNumber ?? '',
      suffix: sample.suffix ?? '',
    },
  });
}

/** Ensures uniqueness across a batch by appending "(2)", "(3)"... on collision. */
export function dedupeFilenames(names: string[]): string[] {
  const counts = new Map<string, number>();
  return names.map((name) => {
    const count = (counts.get(name) ?? 0) + 1;
    counts.set(name, count);
    return count === 1 ? name : `${name} (${count})`;
  });
}
