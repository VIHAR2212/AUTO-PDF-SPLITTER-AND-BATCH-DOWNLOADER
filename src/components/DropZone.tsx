import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadIcon, FileIcon } from './icons';

interface DropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
}

export function DropZone({ onFile, accept = '.pdf,.docx' }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
      e.target.value = '';
    },
    [onFile],
  );

  return (
    <motion.div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      whileTap={{ scale: 0.995 }}
      animate={{
        borderColor: isDragging ? '#111111' : '#EAEAEA',
        backgroundColor: isDragging ? '#F7F6F3' : '#FFFFFF',
      }}
      transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
      className="card relative flex flex-col items-center justify-center gap-5 rounded-card border-[1.5px] border-dashed p-14 text-center cursor-pointer select-none"
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleSelect} />

      <motion.div
        animate={{ scale: isDragging ? 1.08 : 1 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
        className="flex h-14 w-14 items-center justify-center rounded-control bg-ink dark:bg-white text-white dark:text-ink"
      >
        {isDragging ? <FileIcon width={24} height={24} /> : <UploadIcon width={24} height={24} />}
      </motion.div>

      <div>
        <p className="font-serif text-xl text-ink dark:text-white tracking-tight">
          {isDragging ? 'Drop it here' : 'Drag & drop your manual'}
        </p>
        <p className="mt-1.5 text-sm text-ink-muted">or click to browse — processed entirely on your device</p>
      </div>

      <div className="flex gap-1.5">
        <span className="tag tag-neutral">PDF</span>
        <span className="tag tag-neutral">DOCX</span>
        <span className="tag tag-green">No upload, ever</span>
      </div>
    </motion.div>
  );
}
