import { useCallback, useRef, useState } from 'react';
import type {
  AppSettings,
  DetectedSection,
  DuplicateWarning,
  MissingWarning,
  ProcessingStage,
  SourceDocument,
} from '@/types';
import { loadPdf, extractAllPageText, extractBookmarks, renderThumbnail } from '@/lib/pdf/extractText';
import { extractDocxAsPages } from '@/lib/docx/extractDocx';
import { renderDocxPagesToPdf } from '@/lib/docx/docxToPdf';
import { ocrFallbackForSparsePages } from '@/lib/ocr/ocrEngine';
import {
  buildSectionsFromHeadings,
  buildSectionsFromBookmarks,
  detectHeadings,
  findDuplicates,
  findMissingSequence,
} from '@/lib/detection/buildSections';
import type * as pdfjsLib from 'pdfjs-dist';

interface ProcessorState {
  stage: ProcessingStage;
  progressLabel: string;
  progressPct: number;
  document: SourceDocument | null;
  sections: DetectedSection[];
  duplicates: DuplicateWarning[];
  missing: MissingWarning[];
  error: string | null;
  processingTimeMs: number;
}

const initialState: ProcessorState = {
  stage: 'idle',
  progressLabel: '',
  progressPct: 0,
  document: null,
  sections: [],
  duplicates: [],
  missing: [],
  error: null,
  processingTimeMs: 0,
};

export function useDocumentProcessor(settings: AppSettings) {
  const [state, setState] = useState<ProcessorState>(initialState);
  // Keep the live pdf.js document around for thumbnail rendering / OCR reuse
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const pdfBytesRef = useRef<ArrayBuffer | Uint8Array | null>(null);

  const setProgress = (stage: ProcessingStage, label: string, pct: number) =>
    setState((s) => ({ ...s, stage, progressLabel: label, progressPct: pct }));

  const processFile = useCallback(
    async (file: File) => {
      const startedAt = performance.now();
      setState({ ...initialState, stage: 'reading', progressLabel: `Reading ${file.name}...`, progressPct: 2 });

      try {
        const isDocx = /\.docx$/i.test(file.name);
        const originalBytes = await file.arrayBuffer();

        let pdfBytesForPipeline: ArrayBuffer | Uint8Array;

        if (isDocx) {
          setProgress('extracting-text', 'Extracting text from DOCX...', 15);
          const { pages } = await extractDocxAsPages(originalBytes);
          setProgress('extracting-text', 'Laying out pages...', 30);
          pdfBytesForPipeline = await renderDocxPagesToPdf(pages);
        } else {
          pdfBytesForPipeline = originalBytes;
        }

        pdfBytesRef.current = pdfBytesForPipeline;
        setProgress('reading', 'Loading document...', 35);
        const { doc, totalPages } = await loadPdf(pdfBytesForPipeline);
        pdfDocRef.current = doc;

        setProgress('extracting-text', 'Extracting page text...', 45);
        let pages = await extractAllPageText(doc, (p, total) => {
          setProgress('extracting-text', `Extracting page text (${p}/${total})...`, 45 + (p / total) * 15);
        });

        // OCR fallback for pages with little/no extractable text (scanned docs)
        const needsOcr =
          settings.detectionMode === 'ocr-only' ||
          (settings.detectionMode === 'auto' && pages.some((p) => p.text.replace(/\s+/g, '').length < 20));

        if (needsOcr && settings.detectionMode !== 'regex-only') {
          setProgress('ocr-fallback', 'Running OCR on scanned pages...', 62);
          pages = await ocrFallbackForSparsePages(doc, pages, settings.ocrLanguage, (done, total) => {
            setProgress('ocr-fallback', `OCR pass (${done}/${total})...`, 62 + (done / Math.max(total, 1)) * 15);
          });
        }

        setProgress('detecting-sections', 'Detecting experiments & sections...', 80);
        const headingHits = detectHeadings(pages);
        let sections = buildSectionsFromHeadings(headingHits, totalPages);

        // If regex found nothing at all, try bookmarks as a secondary source
        if (sections.length === 0) {
          const bookmarks = await extractBookmarks(doc);
          if (bookmarks.length > 0) {
            sections = buildSectionsFromBookmarks(bookmarks, totalPages);
          }
        }

        setProgress('rendering-thumbnails', 'Rendering thumbnails...', 90);
        const withThumbnails = await Promise.all(
          sections.map(async (s) => {
            try {
              const thumb = await renderThumbnail(doc, s.startPage);
              return { ...s, thumbnailDataUrl: thumb };
            } catch {
              return s;
            }
          }),
        );

        const duplicates = findDuplicates(withThumbnails);
        const missing = findMissingSequence(withThumbnails);

        const sourceDoc: SourceDocument = {
          id: `doc-${Date.now()}`,
          fileName: file.name,
          fileType: isDocx ? 'docx' : 'pdf',
          totalPages,
          bytes: pdfBytesForPipeline,
          sizeBytes: file.size,
          importedAt: Date.now(),
        };

        setState({
          stage: 'ready',
          progressLabel: 'Done',
          progressPct: 100,
          document: sourceDoc,
          sections: withThumbnails,
          duplicates,
          missing,
          error: null,
          processingTimeMs: performance.now() - startedAt,
        });
      } catch (err) {
        setState((s) => ({
          ...s,
          stage: 'error',
          error: err instanceof Error ? err.message : 'Unknown error while processing file',
        }));
      }
    },
    [settings.detectionMode, settings.ocrLanguage],
  );

  const updateSections = useCallback((sections: DetectedSection[]) => {
    setState((s) => ({
      ...s,
      sections,
      duplicates: findDuplicates(sections),
      missing: findMissingSequence(sections),
    }));
  }, []);

  const reset = useCallback(() => {
    pdfDocRef.current = null;
    pdfBytesRef.current = null;
    setState(initialState);
  }, []);

  return { state, processFile, updateSections, reset, pdfDocRef, pdfBytesRef };
}
