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
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: bytes });
  const { value: rawText } = await mammoth.extractRawText({ arrayBuffer: bytes });

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
