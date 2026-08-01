import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PageText } from '../pdf/extractText';

const PAGE_WIDTH = 612; // Letter size in points
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const FONT_SIZE = 11;
const LINE_HEIGHT = 15;

/**
 * Renders extracted DOCX "pages" (paragraph chunks) into a real paginated
 * PDF so downstream splitting/export code can treat DOCX and PDF sources
 * identically. This is a plain-text layout (no original DOCX styling) —
 * acceptable for a splitting tool where content boundaries matter more than
 * pixel-perfect fidelity.
 */
export async function renderDocxPagesToPdf(pages: PageText[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const maxCharsPerLine = 92;

  for (const page of pages) {
    const pdfPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let cursorY = PAGE_HEIGHT - MARGIN;

    const lines = page.text.split('\n');
    for (const rawLine of lines) {
      const wrapped = wrapLine(rawLine, maxCharsPerLine);
      for (const line of wrapped) {
        if (cursorY < MARGIN) break; // overflow: content beyond this is truncated for that pseudo-page
        const looksLikeHeading = /^[A-Z0-9 .:\-–—]{4,}$/.test(line.trim()) && line.trim().length < 60;
        pdfPage.drawText(line, {
          x: MARGIN,
          y: cursorY,
          size: FONT_SIZE,
          font: looksLikeHeading ? boldFont : font,
          color: rgb(0.1, 0.1, 0.1),
        });
        cursorY -= LINE_HEIGHT;
      }
    }
  }

  return pdfDoc.save();
}

function wrapLine(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) return [line];
  const words = line.split(' ');
  const out: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxChars) {
      if (current) out.push(current.trim());
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
  }
  if (current) out.push(current.trim());
  return out;
}
