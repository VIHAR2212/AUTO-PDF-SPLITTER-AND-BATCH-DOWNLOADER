import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DetectedSection } from '@/types';
import { XIcon } from './icons';
import { renderThumbnail } from '@/lib/pdf/extractText';
import type * as pdfjsLib from 'pdfjs-dist';

interface PreviewModalProps {
  section: DetectedSection | null;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  onClose: () => void;
}

export function PreviewModal({ section, pdfDoc, onClose }: PreviewModalProps) {
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!section || !pdfDoc) {
      setPageImages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const pagesToShow = Math.min(section.endPage - section.startPage + 1, 4);
    const pageNumbers = Array.from({ length: pagesToShow }, (_, i) => section.startPage + i);

    Promise.all(pageNumbers.map((p) => renderThumbnail(pdfDoc, p, 320))).then((images) => {
      if (!cancelled) {
        setPageImages(images);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [section, pdfDoc]);

  return (
    <AnimatePresence>
      {section && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="card max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line dark:border-white/10 px-5 py-4">
              <div>
                <h3 className="font-serif text-lg text-ink dark:text-white tracking-tight">{section.title}</h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Pages {section.startPage}–{section.endPage}
                </p>
              </div>
              <button onClick={onClose} className="btn-ghost">
                <XIcon width={15} height={15} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="skeleton aspect-[3/4] rounded-[6px]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {pageImages.map((img, i) => (
                    <div key={i} className="overflow-hidden rounded-[6px] border border-line dark:border-white/10">
                      <img src={img} alt={`Page ${section.startPage + i}`} className="w-full" />
                    </div>
                  ))}
                </div>
              )}
              {section.endPage - section.startPage + 1 > 4 && (
                <p className="mt-3 text-center text-xs text-ink-faint">
                  + {section.endPage - section.startPage + 1 - 4} more pages in this section
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
