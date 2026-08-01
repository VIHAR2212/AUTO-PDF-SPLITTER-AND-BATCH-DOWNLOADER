import { motion } from 'framer-motion';
import type { ProcessingStage } from '@/types';
import { SpinnerIcon } from './icons';

const STAGE_LABELS: Record<ProcessingStage, string> = {
  idle: '',
  reading: 'Reading file',
  'extracting-text': 'Extracting text',
  'detecting-sections': 'Detecting sections',
  'ocr-fallback': 'Running OCR',
  'rendering-thumbnails': 'Rendering thumbnails',
  ready: 'Ready',
  splitting: 'Splitting PDF',
  exporting: 'Exporting',
  error: 'Error',
};

export function ProgressOverlay({
  stage,
  label,
  pct,
}: {
  stage: ProcessingStage;
  label: string;
  pct: number;
}) {
  if (stage === 'idle' || stage === 'ready' || stage === 'error') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      className="card mx-auto flex max-w-md flex-col items-center gap-5 rounded-card p-10"
    >
      <SpinnerIcon width={26} height={26} className="text-ink dark:text-white" />
      <div className="w-full text-center">
        <p className="font-serif text-lg text-ink dark:text-white tracking-tight">
          {STAGE_LABELS[stage] || 'Processing'}
        </p>
        <p className="mt-1 text-xs text-ink-muted">{label}</p>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-bone-200 dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-ink dark:bg-white"
          animate={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        />
      </div>
    </motion.div>
  );
}
