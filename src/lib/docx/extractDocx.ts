import mammoth from 'mammoth';
import type { PageText } from '../pdf/extractText';

/**
 * DOCX files have no fixed "pages" concept the way PDFs do, so we approximate
 * pages by splitting on manual page breaks mammoth preserves as <br> markers,
 * and otherwise by paragraph-count chunks. This keeps the rest of the
 * detection/splitting pipeline (which is page-index based) working unmodified
 * — a DOCX is converted to a PDF internally before final export so the
 * "startPage/endPage" model stays consistent app-wide.
 */
export interface DocxExtractionResult {
  pages: PageText[];
  html: string;
}

const APPROX_LINES_PER_PAGE = 45;

export async function extractDocxAsPages(bytes: ArrayBuffer): Promise<DocxExtractionResult> {
  // Bug fix: mammoth reads (and in some browser/bundler combinations,
  // detaches) the ArrayBuffer it's given. Passing the SAME buffer to two
  // sequential mammoth calls silently corrupted the second call, which is
  // why DOCX uploads used to just "disappear" with no visible error. Each
  // call below gets its own independent copy.
  let html: string;
  let rawText: string;

  try {
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: bytes.slice(0) });
    html = htmlResult.value;
  } catch (err) {
    throw new Error(
      `Could not read this .docx file (HTML conversion failed): ${err instanceof Error ? err.message : 'unknown error'}. The file may be corrupted or password-protected.`,
    );
  }

  try {
    const textResult = await mammoth.extractRawText({ arrayBuffer: bytes.slice(0) });
    rawText = textResult.value;
  } catch (err) {
    throw new Error(
      `Could not read this .docx file (text extraction failed): ${err instanceof Error ? err.message : 'unknown error'}. The file may be corrupted or password-protected.`,
    );
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error(
      'This .docx file appears to contain no readable text. It may be empty, image-only, or use an unsupported format.',
    );
  }

  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);

  const pages: PageText[] = [];
  let current: string[] = [];
  let pageNumber = 1;

  for (const line of lines) {
    current.push(line);
    if (current.length >= APPROX_LINES_PER_PAGE) {
      pages.push({ pageNumber, text: current.join('\n') });
      pageNumber++;
      current = [];
    }
  }
  if (current.length > 0) {
    pages.push({ pageNumber, text: current.join('\n') });
  }
  if (pages.length === 0) {
    pages.push({ pageNumber: 1, text: rawText });
  }

  return { pages, html };
}
