// ---------------------------------------------------------------------------
// Core domain types shared across the extension.
// ---------------------------------------------------------------------------

export type Theme = 'light' | 'dark' | 'system';

export type DetectionMode = 'auto' | 'regex-only' | 'ocr-only';

export type CompressionLevel = 'none' | 'balanced' | 'max';

export type ExportFormat = 'zip' | 'individual';

export type SectionCategory =
  | 'Experiment'
  | 'Assignment'
  | 'Practical'
  | 'Chapter'
  | 'Unit'
  | 'Section'
  | 'Viva'
  | 'Custom';

export interface AppSettings {
  theme: Theme;
  detectionMode: DetectionMode;
  ocrLanguage: string;
  compression: CompressionLevel;
  namingTemplate: string;
  category: SectionCategory;
  prefix: string;
  rollNumber: string;
  suffix: string;
  exportFormat: ExportFormat;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  detectionMode: 'auto',
  ocrLanguage: 'eng',
  compression: 'balanced',
  namingTemplate: '{Category} {Number} {Roll}',
  category: 'Experiment',
  prefix: '',
  rollNumber: '',
  suffix: '',
  exportFormat: 'zip',
};

/** How a given section's boundaries were discovered. */
export type DetectionSource = 'regex' | 'bookmark' | 'ocr' | 'manual';

export interface DetectedSection {
  id: string;
  /** Raw heading category detected, e.g. "Experiment", "Chapter" */
  category: string;
  /** The number/index detected for this section, as a string to preserve things like "3A" */
  number: string;
  /** User-editable display title, defaults to `${category} ${number}` */
  title: string;
  /** 1-indexed, inclusive page range in the source document */
  startPage: number;
  endPage: number;
  source: DetectionSource;
  /** Raw matched heading text, useful for debugging/preview */
  matchedText: string;
  /** Confidence 0-1 - lower confidence sections are flagged in UI */
  confidence: number;
  /** Populated lazily once a thumbnail has been rendered */
  thumbnailDataUrl?: string;
  /** true if the user manually edited page range or title */
  manuallyEdited?: boolean;
}

export interface SourceDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'docx';
  totalPages: number;
  /** original document bytes, kept in memory only for the session */
  bytes: ArrayBuffer | Uint8Array;
  sizeBytes: number;
  importedAt: number;
}

export interface ProcessingStats {
  totalPages: number;
  detectedSections: number;
  outputSizeBytes: number;
  processingTimeMs: number;
}

export interface RecentFileEntry {
  id: string;
  fileName: string;
  importedAt: number;
  sectionCount: number;
  totalPages: number;
}

export interface DuplicateWarning {
  number: string;
  sectionIds: string[];
}

export interface MissingWarning {
  /** e.g. "Experiment 4 appears to be missing between 3 and 5" */
  message: string;
  afterNumber: string;
  beforeNumber: string;
}

export type ProcessingStage =
  | 'idle'
  | 'reading'
  | 'extracting-text'
  | 'detecting-sections'
  | 'ocr-fallback'
  | 'rendering-thumbnails'
  | 'ready'
  | 'splitting'
  | 'exporting'
  | 'error';

export interface HistoryAction {
  type: 'rename' | 'delete' | 'reorder' | 'page-adjust' | 'add' | 'restore-all';
  timestamp: number;
  snapshot: DetectedSection[];
}
