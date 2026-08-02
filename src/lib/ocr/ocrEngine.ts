import { createWorker, type Worker } from 'tesseract.js';
import type * as pdfjsLib from 'pdfjs-dist';
import type { PageText } from '../pdf/extractText';

// Tesseract's worker/core/lang files are loaded from local extension
// assets (bundled at build time) rather than a CDN, keeping the extension
// fully offline as required.

let workerPromise: Promise<Worker> | null = null;

async function getWorker(lang: string): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker(lang, undefined, {
      // These paths are copied into dist/tesseract by the build (see vite
      // publicDir handling / postbuild copy step documented in README).
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/tesseract-core.wasm.js',
      langPath: '/tesseract/lang-data',
    });
  }
  return workerPromise;
}

export async function ocrPage(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  lang: string,
  scale = 2,
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable for OCR rendering');

  await page.render({ canvasContext: ctx, viewport }).promise;

  const worker = await getWorker(lang);
  const { data } = await worker.recognize(canvas);
  return data.text;
}

/**
 * Runs OCR only on pages whose extracted text looks empty/garbled — this is
 * the fallback path, not the primary path, to keep processing fast.
 */
export async function ocrFallbackForSparsePages(
  doc: pdfjsLib.PDFDocumentProxy,
  pages: PageText[],
  lang: string,
  onProgress?: (done: number, total: number) => void,
): Promise<PageText[]> {
  const sparse = pages.filter((p) => isTextSparse(p.text));
  if (sparse.length === 0) return pages;

  const result = [...pages];
  let done = 0;
  for (const page of sparse) {
    try {
      const ocrText = await ocrPage(doc, page.pageNumber, lang);
      const idx = result.findIndex((p) => p.pageNumber === page.pageNumber);
      if (idx !== -1) result[idx] = { pageNumber: page.pageNumber, text: ocrText };
    } catch {
      // Leave original (possibly empty) text if OCR fails for this page
    }
    done++;
    onProgress?.(done, sparse.length);
  }
  return result;
}

function isTextSparse(text: string): boolean {
  const cleaned = text.replace(/\s+/g, '');
  return cleaned.length < 20;
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
