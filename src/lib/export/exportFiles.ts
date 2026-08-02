import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { SplitResult } from '../pdf/splitPdf';
import type { DocxSplitResult } from '../docx/splitAsDocx';

export async function exportAsZip(results: SplitResult[], zipName = 'split-experiments.zip'): Promise<number> {
  const zip = new JSZip();
  for (const r of results) {
    zip.file(`${r.fileName}.pdf`, r.bytes);
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  saveAs(blob, zipName);
  return blob.size;
}

export async function exportIndividually(results: SplitResult[]): Promise<number> {
  let totalSize = 0;
  for (const r of results) {
    const blob = new Blob([new Uint8Array(r.bytes)], { type: 'application/pdf' });
    totalSize += blob.size;
    saveAs(blob, `${r.fileName}.pdf`);
    // Small delay so Chrome doesn't drop rapid-fire downloads
    await new Promise((res) => setTimeout(res, 120));
  }
  return totalSize;
}

export async function exportDocxAsZip(results: DocxSplitResult[], zipName = 'split-experiments.zip'): Promise<number> {
  const zip = new JSZip();
  for (const r of results) {
    zip.file(`${r.fileName}.docx`, r.bytes);
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  saveAs(blob, zipName);
  return blob.size;
}

export async function exportDocxIndividually(results: DocxSplitResult[]): Promise<number> {
  let totalSize = 0;
  for (const r of results) {
    const blob = new Blob([new Uint8Array(r.bytes)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    totalSize += blob.size;
    saveAs(blob, `${r.fileName}.docx`);
    await new Promise((res) => setTimeout(res, 120));
  }
  return totalSize;
}

export function totalOutputSize(results: SplitResult[] | DocxSplitResult[]): number {
  return results.reduce((sum, r) => sum + r.bytes.byteLength, 0);
}
