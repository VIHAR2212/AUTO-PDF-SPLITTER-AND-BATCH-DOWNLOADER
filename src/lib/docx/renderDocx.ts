import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import type { PageText } from '../pdf/extractText';

/**
 * Builds a real, openable .docx file from a set of "pages" (line-grouped
 * text), used when the user's export format needs to come back out as Word
 * rather than PDF. Heading-shaped lines (short, all-caps, or matching the
 * same detection patterns used elsewhere) are rendered as actual Word
 * heading styles rather than plain paragraphs, so the output isn't just a
 * wall of undifferentiated text.
 */
export async function renderPagesToDocx(pages: PageText[], title?: string): Promise<Uint8Array> {
  const children: Paragraph[] = [];

  if (title) {
    children.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
      }),
    );
  }

  for (const page of pages) {
    const lines = page.text.split('\n').filter((l) => l.trim().length > 0);

    for (const line of lines) {
      const trimmed = line.trim();
      const looksLikeHeading =
        trimmed.length < 60 &&
        (trimmed === trimmed.toUpperCase() || /^(Experiment|Assignment|Practical|Chapter|Unit|Section|Viva)\b/i.test(trimmed));

      if (looksLikeHeading) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: trimmed, bold: true })],
            spacing: { before: 240, after: 120 },
          }),
        );
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed })],
            spacing: { after: 100 },
          }),
        );
      }
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}
