import type * as pdfjsLib from 'pdfjs-dist';
import type { DetectedSection } from '@/types';
import { extractPageRangeText } from '../pdf/extractText';
import { renderPagesToDocx } from './renderDocx';

export interface DocxSplitResult {
  section: DetectedSection;
  bytes: Uint8Array;
  fileName: string;
}

/**
 * The requested pipeline: PDF (already split into per-section page ranges
 * by the existing detection/splitting logic) -> re-extract that section's
 * text from the live pdf.js document -> render a fresh, real .docx per
 * section. This runs entirely in-browser; nothing leaves the machine.
 */
export async function splitAsDocx(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  sections: DetectedSection[],
  fileNames: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<DocxSplitResult[]> {
  const results: DocxSplitResult[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const pages = await extractPageRangeText(pdfDoc, section.startPage, section.endPage);
    const bytes = await renderPagesToDocx(pages, section.title);
    results.push({ section, bytes, fileName: fileNames[i] ?? section.title });
    onProgress?.(i + 1, sections.length);
  }

  return results;
}
