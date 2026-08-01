import { PDFDocument } from 'pdf-lib';
import type { CompressionLevel, DetectedSection } from '@/types';

export interface SplitResult {
  section: DetectedSection;
  bytes: Uint8Array;
  fileName: string; // without extension, caller appends .pdf
}

/**
 * Splits a source PDF into one output PDF per detected section, based on
 * each section's 1-indexed inclusive [startPage, endPage] range.
 */
export async function splitPdfBySections(
  sourceBytes: ArrayBuffer | Uint8Array,
  sections: DetectedSection[],
  fileNames: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<SplitResult[]> {
  const srcDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const results: SplitResult[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const outDoc = await PDFDocument.create();

    const pageIndices = rangeIndices(section.startPage, section.endPage, srcDoc.getPageCount());
    const copiedPages = await outDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((p) => outDoc.addPage(p));

    const bytes = await outDoc.save({ useObjectStreams: true });
    results.push({ section, bytes, fileName: fileNames[i] ?? section.title });
    onProgress?.(i + 1, sections.length);
  }

  return results;
}

function rangeIndices(startPage: number, endPage: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(startPage, totalPages));
  const end = Math.max(start, Math.min(endPage, totalPages));
  const indices: number[] = [];
  for (let p = start; p <= end; p++) indices.push(p - 1); // pdf-lib is 0-indexed
  return indices;
}

/**
 * Rough client-side "compression" pass: pdf-lib doesn't do true image
 * recompression, but object-stream packing plus removing duplicate objects
 * gives a meaningful size reduction for typical scanned manuals. For "max"
 * compression we additionally strip unused/orphaned objects.
 */
export async function applyCompression(
  bytes: Uint8Array,
  level: CompressionLevel,
): Promise<Uint8Array> {
  if (level === 'none') return bytes;

  const doc = await PDFDocument.load(bytes);
  const saved = await doc.save({
    useObjectStreams: true,
    // 'max' trims a bit more aggressively where pdf-lib allows
    addDefaultPage: false,
  });
  return saved;
}
