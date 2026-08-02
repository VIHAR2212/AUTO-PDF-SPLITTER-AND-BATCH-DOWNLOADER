import * as pdfjsLib from 'pdfjs-dist';
// Vite will bundle the worker as an asset; ?url gives us a static path we can
// register with pdf.js without relying on a CDN (offline-first requirement).
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PageText {
  pageNumber: number; // 1-indexed
  text: string;
}

export interface PdfBookmark {
  title: string;
  pageNumber: number; // 1-indexed
  children: PdfBookmark[];
}

export interface LoadedPdf {
  doc: pdfjsLib.PDFDocumentProxy;
  totalPages: number;
}

export async function loadPdf(bytes: ArrayBuffer | Uint8Array): Promise<LoadedPdf> {
  // pdf.js detaches/consumes the buffer, so hand it a copy.
  const copy = bytes instanceof Uint8Array ? bytes.slice(0) : bytes.slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: copy });
  const doc = await loadingTask.promise;
  return { doc, totalPages: doc.numPages };
}

export async function extractPageRangeText(
  doc: pdfjsLib.PDFDocumentProxy,
  startPage: number,
  endPage: number,
): Promise<PageText[]> {
  const pages: PageText[] = [];
  for (let i = startPage; i <= endPage; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lineText = reconstructLines(content.items as TextItemLike[]);
    pages.push({ pageNumber: i, text: lineText });
  }
  return pages;
}

export async function extractAllPageText(
  doc: pdfjsLib.PDFDocumentProxy,
  onProgress?: (page: number, total: number) => void,
): Promise<PageText[]> {
  const pages: PageText[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      // Normalize whitespace but preserve rough line breaks via a heuristic:
      // pdf.js gives us a flat item stream with 'hasEOL' flags, but joining
      // with a space then also inserting explicit breaks below.
      .replace(/\s+/g, ' ')
      .trim();

    // Rebuild rough line structure from item y-positions for better heading detection.
    const lineText = reconstructLines(content.items as TextItemLike[]);

    pages.push({ pageNumber: i, text: lineText || text });
    onProgress?.(i, doc.numPages);
  }
  return pages;
}

interface TextItemLike {
  str: string;
  transform: number[];
}

/** Groups text items into lines based on vertical position, so regexes that
 * expect a heading to start a line behave correctly. */
function reconstructLines(items: TextItemLike[]): string {
  const rows = new Map<number, { x: number; str: string }[]>();
  const TOLERANCE = 2;

  for (const item of items) {
    if (!('str' in item) || !item.str.trim()) continue;
    const y = item.transform[5] ?? 0;
    let key: number | undefined;
    for (const existingY of rows.keys()) {
      if (Math.abs(existingY - y) <= TOLERANCE) {
        key = existingY;
        break;
      }
    }
    if (key === undefined) key = y;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key)!.push({ x: item.transform[4] ?? 0, str: item.str });
  }

  const sortedYs = Array.from(rows.keys()).sort((a, b) => b - a);
  const lines = sortedYs.map((y) =>
    rows
      .get(y)!
      .sort((a, b) => a.x - b.x)
      .map((r) => r.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );

  return lines.filter(Boolean).join('\n');
}

export async function extractBookmarks(doc: pdfjsLib.PDFDocumentProxy): Promise<PdfBookmark[]> {
  const outline = await doc.getOutline();
  if (!outline) return [];

  async function resolveDest(dest: unknown): Promise<number | null> {
    try {
      let d = dest;
      if (typeof d === 'string') {
        d = await doc.getDestination(d);
      }
      if (!Array.isArray(d) || !d[0]) return null;
      const pageIndex = await doc.getPageIndex(d[0]);
      return pageIndex + 1;
    } catch {
      return null;
    }
  }

  async function walk(items: typeof outline): Promise<PdfBookmark[]> {
    const result: PdfBookmark[] = [];
    for (const item of items) {
      const pageNumber = (await resolveDest(item.dest)) ?? 1;
      const children = item.items?.length ? await walk(item.items) : [];
      result.push({ title: item.title, pageNumber, children });
    }
    return result;
  }

  return walk(outline);
}

/** Renders a page to a data URL thumbnail (JPEG) at a small scale for UI cards. */
export async function renderThumbnail(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  maxWidth = 180,
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.72);
}
